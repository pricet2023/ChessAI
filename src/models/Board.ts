import { getPossibleBishopMoves, getPossibleKingMoves, getPossibleKnightMoves, getPossiblePawnMoves, getPossibleQueenMoves, getPossibleRookMoves, getCastlingMoves } from "../ruleSets";
import { PieceType, TeamType } from "../Types";
import { Pawn } from "./Pawn";
import { Piece } from "./Piece";
import { Position } from "./Position";

function to_fen_char(type: PieceType): string {
    switch (type) {
        case PieceType.BISHOP:
            return 'b';
        case PieceType.KING:
            return 'k';
        case PieceType.KNIGHT:
            return 'n';
        case PieceType.PAWN:
            return 'p';
        case PieceType.QUEEN:
            return 'q';
        case PieceType.ROOK:
            return 'r';
    }
}

function to_square_name(x: number, y: number): string {
    let ret = '';
    switch (x) {
        case 0:
            ret += 'a';
            break;
        case 1:
            ret += 'b';
            break;
        case 2:
            ret += 'c';
            break;
        case 3:
            ret += 'd';
            break;
        case 4:
            ret += 'e';
            break;
        case 5:
            ret += 'f';
            break;
        case 6:
            ret += 'g';
            break;
        case 7:
            ret += 'h';
            break;
    }

    ret += String(y + 1);
    return ret;
}

export class Board {
    pieces: Piece[];
    totalTurns: number;
    winningTeam?: TeamType;
    enPassantSquare: string = '-';
    halfMoveClock: number = 0;

    constructor(pieces: Piece[], totalTurns: number) {
        this.pieces = pieces;
        this.totalTurns = totalTurns;
    }

    get currentTeam(): TeamType {
        return this.totalTurns % 2 === 0 ? TeamType.OPPONENT : TeamType.OUR;
    }

    calculateAllMoves() {
        // Calculate the moves of all the pieces
        for (const piece of this.pieces) {
            piece.possibleMoves = this.getValidMoves(piece, this.pieces)
        }

        // Calculate castling moves
        for (const king of this.pieces.filter(p => p.isKing)) {
            if (king.possibleMoves === undefined) continue;

            king.possibleMoves = [...king.possibleMoves, ...getCastlingMoves(king, this.pieces)];
        }

        // Check if the current team moves are valid
        this.checkCurrentTeamMoves();

        // Remove the posibble moves for the team that is not playing
        for (const piece of
            this.pieces.filter(p => p.team !== this.currentTeam)) {
            piece.possibleMoves = [];
        }

        // Check if the playing team still has moves left
        // Otherwise, checkmate!
        if (this.pieces.filter(p => p.team === this.currentTeam)
            .some(p => p.possibleMoves !== undefined && p.possibleMoves.length > 0)) return;

        this.winningTeam = (this.currentTeam === TeamType.OUR) ? TeamType.OPPONENT : TeamType.OUR;
    }

    checkCurrentTeamMoves() {
        // Loop through all the current team's pieces
        for (const piece of this.pieces.filter(p => p.team === this.currentTeam)) {
            if (piece.possibleMoves === undefined) continue;

            // Simulate all the piece moves
            for (const move of piece.possibleMoves) {
                const simulatedBoard = this.clone();

                // Remove the piece at the destination position
                simulatedBoard.pieces = simulatedBoard.pieces.filter(p => !p.samePosition(move));

                // Get the piece of the cloned board
                const clonedPiece = simulatedBoard.pieces.find(p => p.samePiecePosition(piece))!;
                clonedPiece.position = move.clone();

                // Get the king of the cloned board
                const clonedKing = simulatedBoard.pieces.find(p => p.isKing && p.team === simulatedBoard.currentTeam)!;

                // Loop through all enemy pieces, update their possible moves
                // And check if the current team's king will be in danger
                for (const enemy of simulatedBoard.pieces.filter(p => p.team !== simulatedBoard.currentTeam)) {
                    enemy.possibleMoves = simulatedBoard.getValidMoves(enemy, simulatedBoard.pieces);

                    if (enemy.isPawn) {
                        if (enemy.possibleMoves.some(m => m.x !== enemy.position.x
                            && m.samePosition(clonedKing.position))) {
                            piece.possibleMoves = piece.possibleMoves?.filter(m => !m.samePosition(move));
                        }
                    } else {
                        if (enemy.possibleMoves.some(m => m.samePosition(clonedKing.position))) {
                            piece.possibleMoves = piece.possibleMoves?.filter(m => !m.samePosition(move));
                        }
                    }
                }
            }
        }
    }

    getValidMoves(piece: Piece, boardState: Piece[]): Position[] {
        switch (piece.type) {
            case PieceType.PAWN:
                return getPossiblePawnMoves(piece, boardState);
            case PieceType.KNIGHT:
                return getPossibleKnightMoves(piece, boardState);
            case PieceType.BISHOP:
                return getPossibleBishopMoves(piece, boardState);
            case PieceType.ROOK:
                return getPossibleRookMoves(piece, boardState);
            case PieceType.QUEEN:
                return getPossibleQueenMoves(piece, boardState);
            case PieceType.KING:
                return getPossibleKingMoves(piece, boardState);
            default:
                return [];
        }
    }

    playMove(enPassantMove: boolean,
        validMove: boolean,
        playedPiece: Piece,
        destination: Position): boolean {
        const pawnDirection = playedPiece.team === TeamType.OUR ? 1 : -1;
        const destinationPiece = this.pieces.find(p => p.samePosition(destination));

        //add to this for now, if there is a pawn move or capture then it will get reset to 0
        // if returning false the clock will go back 1
        this.halfMoveClock++;

        // If the move is a castling move do this
        if (playedPiece.isKing && destinationPiece?.isRook
            && destinationPiece.team === playedPiece.team) {
            const direction = (destinationPiece.position.x - playedPiece.position.x > 0) ? 1 : -1;
            const newKingXPosition = playedPiece.position.x + direction * 2;
            this.pieces = this.pieces.map(p => {
                if (p.samePiecePosition(playedPiece)) {
                    p.position.x = newKingXPosition;
                } else if (p.samePiecePosition(destinationPiece)) {
                    p.position.x = newKingXPosition - direction;
                }

                return p;
            });

            this.calculateAllMoves();
            return true;
        }

        if (enPassantMove) {
            this.pieces = this.pieces.reduce((results, piece) => {
                if (piece.samePiecePosition(playedPiece)) {
                    if (piece.isPawn)
                        (piece as Pawn).enPassant = false;
                    piece.position.x = destination.x;
                    piece.position.y = destination.y;
                    piece.hasMoved = true;
                    results.push(piece);
                } else if (
                    !piece.samePosition(new Position(destination.x, destination.y - pawnDirection))
                ) {
                    if (piece.isPawn) {
                        (piece as Pawn).enPassant = false;
                    }
                    results.push(piece);
                }

                return results;
            }, [] as Piece[]);

            //set en passant square
            const enPassantY = playedPiece.position.y - pawnDirection;
            const enPassantX = playedPiece.position.x;
            this.enPassantSquare = to_square_name(enPassantX, enPassantY);

            this.halfMoveClock = 0;
            this.calculateAllMoves();
        } else if (validMove) {
            //UPDATES THE PIECE POSITION
            //AND IF A PIECE IS ATTACKED, REMOVES IT
            this.pieces = this.pieces.reduce((results, piece) => {
                // Piece that we are currently moving
                if (piece.samePiecePosition(playedPiece)) {
                    //SPECIAL MOVE
                    if (piece.isPawn) {
                        this.halfMoveClock = 0;
                        (piece as Pawn).enPassant =
                            Math.abs(playedPiece.position.y - destination.y) === 2 &&
                            piece.type === PieceType.PAWN;
                    }
                    piece.position.x = destination.x;
                    piece.position.y = destination.y;
                    piece.hasMoved = true;
                    results.push(piece);
                } else if (!piece.samePosition(destination)) {
                    if (piece.isPawn) {
                        (piece as Pawn).enPassant = false;
                    }
                    results.push(piece);
                } else if (piece.samePosition(destination)) {
                    // if we make it here then a piece as been taken
                    this.halfMoveClock = 0;
                }

                // The piece at the destination location
                // Won't be pushed in the results
                return results;
            }, [] as Piece[]);
            this.enPassantSquare = '-';
            this.calculateAllMoves();
        } else {
            this.halfMoveClock--;
            return false;
        }

        return true;
    }

    clone(): Board {
        return new Board(this.pieces.map(p => p.clone()),
            this.totalTurns);
    }

    getFEN(): string {
        const board_array: (string)[][] = Array(8).fill(null).map(() => Array(8).fill(''));

        for (const piece of this.pieces) {
            const row = piece.position.y;
            const col = piece.position.x;
            const fen_char = to_fen_char(piece.type);
            board_array[row][col] = piece.team === TeamType.OUR ? fen_char.toUpperCase() : fen_char.toLowerCase();
        }

        const fen_rows: string[] = board_array.map(row => {
            let fen_row = '';
            let empty_count = 0;

            for (const square of row) {
                if (square === '') {
                    empty_count++;
                } else {
                    if (empty_count > 0) {
                        fen_row += empty_count;
                        empty_count = 0;
                    }
                    fen_row += square;
                }
            }

            if (empty_count > 0) {
                fen_row += empty_count;
            }

            return fen_row;
        })

        const fenrowstr = fen_rows.join('/');

        //castling rights
        let castlingrights: string = '';
        let blackqueensiderookinplace: boolean = false;
        let blackkingsiderookinplace: boolean = false;
        let blackkinginplace: boolean = false;
        let whitequeensiderookinplace: boolean = false;
        let whitekingsiderookinplace: boolean = false;
        let whitekinginplace: boolean = false;

        for (const piece of this.pieces) {
            if (piece.type === PieceType.ROOK) {
                if (piece.team === TeamType.OUR) {
                    if (piece.position.x === 0 && piece.position.y === 0 && !piece.hasMoved)
                        whitequeensiderookinplace = true;
                    if (piece.position.x === 7 && piece.position.y === 0 && !piece.hasMoved)
                        whitekingsiderookinplace = true;
                }

                if (piece.team === TeamType.OPPONENT) {
                    if (piece.position.x === 0 && piece.position.y === 7 && !piece.hasMoved)
                        blackkingsiderookinplace = true;
                    if (piece.position.x === 7 && piece.position.y === 7 && !piece.hasMoved)
                        blackqueensiderookinplace = true;
                }
            }

            if (piece.type === PieceType.KING) {
                if (piece.team === TeamType.OUR && piece.position.x === 4 && piece.position.y === 0 && !piece.hasMoved) {
                    whitekinginplace = true;
                }
            }

            if (piece.team === TeamType.OPPONENT && piece.position.x === 4 && piece.position.y === 7 && !piece.hasMoved) {
                blackkinginplace = true;
            }
        }

        //add castling rights
        if (whitekinginplace) {
            if (whitekingsiderookinplace) {
                castlingrights += 'K';
            }

            if (whitequeensiderookinplace) {
                castlingrights += 'Q';
            }
        }

        if (blackkinginplace) {
            if (blackkingsiderookinplace) {
                castlingrights += 'k';
            }

            if (blackqueensiderookinplace) {
                castlingrights += 'q';
            }
        }

        //if at this point there are no castling rights, set to the standard FEN 'none' notation
        if (castlingrights === '') {
            castlingrights = '-'
        }

        let currTeam = '';
        switch (this.totalTurns % 2) {
            case 1:
                currTeam = 'w';
                break;
            case 0:
                currTeam = 'b';
        }

        const fen_str = fenrowstr + ' ' + currTeam + ' ' + castlingrights + ' ' + this.enPassantSquare
            + ' ' + String(this.halfMoveClock) + ' ' + String(Math.floor(this.totalTurns / 2) + 1);

        return fen_str;
    }
} 