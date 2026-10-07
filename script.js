class Minesweeper {
    constructor() {
        this.difficulties = {
            easy: { rows: 8, cols: 8, mines: 10 },
            medium: { rows: 12, cols: 12, mines: 30 },
            hard: { rows: 16, cols: 16, mines: 99 }
        };

        this.currentDifficulty = 'easy';
        this.rows = 8;
        this.cols = 8;
        this.mines = 10;
        this.board = [];
        this.revealed = [];
        this.flagged = [];
        this.gameOver = false;
        this.gameWon = false;
        this.firstClick = true;
        this.elapsedTime = 0;
        this.timerId = null;

        this.bindEvents();
        this.startNewGame();
    }

    bindEvents() {
        document.getElementById('newGameBtn').addEventListener('click', () => this.startNewGame());
        document.getElementById('modalBtn').addEventListener('click', () => this.startNewGame());

        document.querySelectorAll('.difficulty-btn').forEach((button) => {
            button.addEventListener('click', () => {
                this.currentDifficulty = button.dataset.level;
                document.querySelectorAll('.difficulty-btn').forEach((btn) => btn.classList.toggle('active', btn === button));
                this.startNewGame();
            });
        });
    }

    startNewGame() {
        const config = this.difficulties[this.currentDifficulty];
        this.rows = config.rows;
        this.cols = config.cols;
        this.mines = config.mines;

        this.board = Array(this.rows * this.cols).fill(0);
        this.revealed = Array(this.rows * this.cols).fill(false);
        this.flagged = Array(this.rows * this.cols).fill(false);
        this.gameOver = false;
        this.gameWon = false;
        this.firstClick = true;
        this.elapsedTime = 0;
        clearInterval(this.timerId);

        document.getElementById('timer').textContent = '0';
        document.getElementById('mineCount').textContent = String(this.mines);
        document.getElementById('flagCount').textContent = '0';
        document.getElementById('gameModal').classList.remove('active');

        this.renderBoard();
    }

    renderBoard() {
        const boardEl = document.getElementById('gameBoard');

        let cellSize = 40;
        if (this.currentDifficulty === 'medium') cellSize = 30;
        if (this.currentDifficulty === 'hard') cellSize = 20;

        boardEl.style.gridTemplateColumns = `repeat(${this.cols}, ${cellSize}px)`;
        boardEl.innerHTML = '';

        for (let i = 0; i < this.rows * this.cols; i++) {
            const cell = document.createElement('button');
            cell.type = 'button';
            cell.className = 'cell';
            cell.dataset.index = String(i);

            cell.addEventListener('click', () => this.handleReveal(i));
            cell.addEventListener('contextmenu', (event) => {
                event.preventDefault();
                this.toggleFlag(i);
            });

            boardEl.appendChild(cell);
        }
    }

    handleReveal(index) {
        if (this.gameOver || this.revealed[index] || this.flagged[index]) {
            return;
        }

        if (this.firstClick) {
            this.placeMines(index);
            this.firstClick = false;
            this.startTimer();
        }

        if (this.board[index] === 'M') {
            this.revealAllMines();
            this.endGame(false);
            return;
        }

        this.revealArea(index);
        this.checkWin();
    }

    placeMines(excludeIndex) {
        let placed = 0;
        while (placed < this.mines) {
            const idx = Math.floor(Math.random() * this.board.length);
            if (idx !== excludeIndex && this.board[idx] !== 'M') {
                this.board[idx] = 'M';
                placed += 1;
            }
        }

        for (let i = 0; i < this.board.length; i++) {
            if (this.board[i] !== 'M') {
                this.board[i] = this.countAdjacentMines(i);
            }
        }
    }

    countAdjacentMines(index) {
        const row = Math.floor(index / this.cols);
        const col = index % this.cols;
        let count = 0;

        for (let r = row - 1; r <= row + 1; r++) {
            for (let c = col - 1; c <= col + 1; c++) {
                if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) {
                    continue;
                }
                const neighborIndex = r * this.cols + c;
                if (this.board[neighborIndex] === 'M') {
                    count += 1;
                }
            }
        }

        return count;
    }

    revealArea(startIndex) {
        const queue = [startIndex];

        while (queue.length > 0) {
            const index = queue.shift();
            if (this.revealed[index] || this.flagged[index]) {
                continue;
            }

            this.revealed[index] = true;
            const cell = this.getCell(index);
            this.updateCellAppearance(cell, index);

            if (this.board[index] !== 0) {
                continue;
            }

            const row = Math.floor(index / this.cols);
            const col = index % this.cols;

            for (let r = row - 1; r <= row + 1; r++) {
                for (let c = col - 1; c <= col + 1; c++) {
                    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) {
                        continue;
                    }

                    const neighborIndex = r * this.cols + c;
                    if (!this.revealed[neighborIndex] && !this.flagged[neighborIndex] && this.board[neighborIndex] !== 'M') {
                        queue.push(neighborIndex);
                    }
                }
            }
        }
    }

    toggleFlag(index) {
        if (this.gameOver || this.revealed[index]) {
            return;
        }

        this.flagged[index] = !this.flagged[index];
        const cell = this.getCell(index);
        this.updateCellAppearance(cell, index);

        const flaggedCount = this.flagged.filter(Boolean).length;
        document.getElementById('flagCount').textContent = String(flaggedCount);
    }

    getCell(index) {
        return document.querySelector(`.cell[data-index="${index}"]`);
    }

    updateCellAppearance(cell, index) {
        if (!cell) {
            return;
        }

        cell.classList.remove('flagged', 'mine', 'revealed', 'empty', 'num-1', 'num-2', 'num-3', 'num-4', 'num-5', 'num-6', 'num-7', 'num-8');
        cell.textContent = '';

        if (this.flagged[index] && !this.revealed[index]) {
            cell.classList.add('flagged');
            cell.textContent = '🚩';
            return;
        }

        if (!this.revealed[index]) {
            return;
        }

        cell.classList.add('revealed');

        if (this.board[index] === 'M') {
            cell.classList.add('mine');
            cell.textContent = '💣';
            return;
        }

        if (this.board[index] === 0) {
            cell.classList.add('empty');
            return;
        }

        cell.classList.add(`num-${this.board[index]}`);
        cell.textContent = String(this.board[index]);
    }

    revealAllMines() {
        for (let i = 0; i < this.board.length; i++) {
            if (this.board[i] === 'M') {
                this.revealed[i] = true;
                const cell = this.getCell(i);
                this.updateCellAppearance(cell, i);
            }
        }
    }

    checkWin() {
        const safeCells = this.rows * this.cols - this.mines;
        const revealedSafeCells = this.revealed.filter((isRevealed, index) => isRevealed && this.board[index] !== 'M').length;

        if (revealedSafeCells === safeCells) {
            this.endGame(true);
        }
    }

    endGame(won) {
        this.gameOver = true;
        this.gameWon = won;
        clearInterval(this.timerId);

        const modal = document.getElementById('gameModal');
        const title = document.getElementById('modalTitle');
        const text = document.getElementById('modalMessage');

        if (won) {
            title.textContent = '🎉 You Won!';
            text.textContent = `You cleared the board in ${this.elapsedTime} seconds.`;
        } else {
            title.textContent = '💣 Game Over';
            text.textContent = 'You hit a mine. Try again!';
        }

        modal.classList.add('active');
    }

    startTimer() {
        this.timerId = setInterval(() => {
            this.elapsedTime += 1;
            document.getElementById('timer').textContent = String(this.elapsedTime);
        }, 1000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Minesweeper();
});
