import './Chessboard.css';
import Tile from "../Tile/Tile";
import { useRef, useState } from 'react';
import Referee from '../../referee/Referee';

const horizontal_axis = ["a", "b", "c", "d", "e", "f", "g", "h"];
const vertical_axis = ["1", "2", "3", "4", "5", "6", "7", "8"];

export interface Piece {
    image: string;
    x: number;
    y: number;
    type: PieceType;
    team: TeamType;
    enPassant?: boolean
}

export enum TeamType {
    OPPONENT,
    OUR,
}

export enum PieceType {
    PAWN,
    BISHOP,
    KNIGHT,
    ROOK,
    KING,
    QUEEN,
}


const initialBoardState: Piece[] = [];

for (let i = 0; i < 8; i++)
{
    initialBoardState.push({image: "assets/images/pawn_b.png", x: i, y: 6, type: PieceType.PAWN, team: TeamType.OPPONENT});
}

for (let i = 0; i < 8; i++)
{
    initialBoardState.push({image: "assets/images/pawn_w.png", x: i, y: 1, type: PieceType.PAWN, team: TeamType.OUR});
}

initialBoardState.push({image: "assets/images/rook_b.png", x: 0, y: 7, type: PieceType.ROOK, team: TeamType.OPPONENT});
initialBoardState.push({image: "assets/images/rook_b.png", x: 7, y: 7, type: PieceType.ROOK, team: TeamType.OPPONENT});
initialBoardState.push({image: "assets/images/rook_w.png", x: 0, y: 0, type: PieceType.ROOK, team: TeamType.OUR});
initialBoardState.push({image: "assets/images/rook_w.png", x: 7, y: 0, type: PieceType.ROOK, team: TeamType.OUR});

initialBoardState.push({image: "assets/images/knight_b.png", x: 1, y: 7, type: PieceType.KNIGHT, team: TeamType.OPPONENT});
initialBoardState.push({image: "assets/images/knight_b.png", x: 6, y: 7, type: PieceType.KNIGHT, team: TeamType.OPPONENT});
initialBoardState.push({image: "assets/images/knight_w.png", x: 1, y: 0, type: PieceType.KNIGHT, team: TeamType.OUR});
initialBoardState.push({image: "assets/images/knight_w.png", x: 6, y: 0, type: PieceType.KNIGHT, team: TeamType.OUR});

initialBoardState.push({image: "assets/images/bishop_b.png", x: 2, y: 7, type: PieceType.BISHOP, team: TeamType.OPPONENT});
initialBoardState.push({image: "assets/images/bishop_b.png", x: 5, y: 7, type: PieceType.BISHOP, team: TeamType.OPPONENT});
initialBoardState.push({image: "assets/images/bishop_w.png", x: 5, y: 0, type: PieceType.BISHOP, team: TeamType.OUR});
initialBoardState.push({image: "assets/images/bishop_w.png", x: 2, y: 0, type: PieceType.BISHOP, team: TeamType.OUR});

initialBoardState.push({image: "assets/images/queen_b.png", x: 3, y: 7, type: PieceType.QUEEN, team: TeamType.OPPONENT
});
initialBoardState.push({image: "assets/images/queen_w.png", x: 3, y: 0, type: PieceType.QUEEN, team: TeamType.OUR
});

initialBoardState.push({image: "assets/images/king_b.png", x: 4, y: 7, type: PieceType.KING, team: TeamType.OPPONENT});
initialBoardState.push({image: "assets/images/king_w.png", x: 4, y: 0, type: PieceType.KING, team: TeamType.OUR});



export default function Chessboard()
{
    const [activePiece, setActivePiece] = useState<HTMLElement | null>(null);
    const [gridX, setGridX] = useState(0);
    const [gridY, setGridY] = useState(0);
    const [pieces, setPieces] = useState<Piece[]>(initialBoardState);
    const chessboardRef = useRef<HTMLDivElement>(null);
    const referee = new Referee();


    function grabPiece(e: React.MouseEvent)
    {
        const element = e.target as HTMLElement;
        const chessboard = chessboardRef.current;
        if (element.classList.contains("chess-piece") && chessboard)
        {
            setGridX(Math.floor((e.clientX - chessboard.offsetLeft) / 100));
            setGridY(Math.abs(Math.ceil((e.clientY - chessboard.offsetTop - 800) / 100)));
            const x = e.clientX - 50;
            const y = e.clientY - 50;
            element.style.position = "absolute";
            element.style.left = `${x}px`;
            element.style.top = `${y}px`;

            setActivePiece(element);
        }
    }

    function movePiece(e: React.MouseEvent)
    {
        const chessboard = chessboardRef.current;

        if (activePiece && chessboard)
        {
            const minX = chessboard.offsetLeft - 25;
            const minY = chessboard.offsetTop - 25;
            const maxX = chessboard.offsetLeft + chessboard.clientWidth - 75;
            const maxY = chessboard.offsetTop + chessboard.clientHeight - 75;
            const x = e.clientX - 50;
            const y = e.clientY - 50;
            activePiece.style.position = "absolute";
            
            if (x < minX)
            {
                activePiece.style.left = `${minX}px`;
            } else if (x > maxX) {
                activePiece.style.left = `${maxX}px`;
            } else {
                activePiece.style.left = `${x}px`;
            }

            if (y < minY)
            {
                activePiece.style.top = `${minY}px`;
            } else if (y > maxY) {
                activePiece.style.top = `${maxY}px`;
            } else {
                activePiece.style.top = `${y}px`;
            }
        }
    }

    function dropPiece(e: React.MouseEvent)
    {
        const chessboard = chessboardRef.current;
        if (activePiece && chessboard)
        {
            const x = Math.floor((e.clientX - chessboard.offsetLeft) / 100);
            const y = Math.abs(Math.ceil((e.clientY - chessboard.offsetTop - 800) / 100));


            const currentPiece = pieces.find(p => p.x === gridX && p.y === gridY);
            const attackedPiece = pieces.find(p => p.x === x && p.y === y);

            if (currentPiece)
            {
                const validMove = referee.isValidMove(gridX, gridY, x, y, currentPiece.type, currentPiece.team, pieces);
                const isEnPassantMove = referee.isEnPassantMove(gridX, gridY, x, y, currentPiece.type, currentPiece.team, pieces);
                

                const pawnDirection =  (currentPiece.team == TeamType.OUR) ? 1 : -1;
                if (isEnPassantMove)
                {
                    const updatedPieces = pieces.reduce((results, piece) => {
                        if (piece.x == gridX && piece.y === gridY)
                        {
                            piece.x = x;
                            piece.y = y;
                            results.push(piece);
                        }
                        else if (!(piece.x === x && piece.y === y - pawnDirection))
                        {
                            if (piece.type === PieceType.PAWN)
                            {
                                piece.enPassant = false;
                            }
                            results.push(piece);
                        }

                        return results;
                    },[] as Piece[])
                    setPieces(updatedPieces);
                }
                else if (validMove)
                {
                    //update piece position
                    // and if piece attacked remove it
                    const updatedPieces = pieces.reduce((results, piece) => {
                        if (piece.x == gridX && piece.y === gridY)
                        {
                            if (Math.abs(gridY - y) === 2 && piece.type === PieceType.PAWN)
                            {
                                //special move
                                piece.enPassant = true;
                            }
                            else
                            {
                                piece.enPassant = false;   
                            }
                            piece.x = x;
                            piece.y = y;
                            results.push(piece);
                        }
                        else if (!(piece.x === x && piece.y === y))
                        {
                            if (piece.type === PieceType.PAWN)
                            {
                                piece.enPassant = false;
                            }
                            results.push(piece);
                        }


                        return results;
                    }, [] as Piece[]);

                    setPieces(updatedPieces);

                }
                else 
                {
                    //reset piece position

                    activePiece.style.position = "relative";
                    activePiece.style.removeProperty("top");
                    activePiece.style.removeProperty("left");
                }
                   
            }
            
            setActivePiece(null);
        }
    }

    let board = [];
    for (let j = vertical_axis.length - 1; j >= 0; j--)
    {
        for (let i = 0; i < horizontal_axis.length; i++)
        {
            const num = i + j + 2
            let image = undefined;
            pieces.forEach(p => {
                if (p.x === i && p.y === j)
                {
                    image = p.image;
                }
            });

            board.push(<Tile key={`${j},${i}`} image={image} number={num}/>);
        }
    }
    return <div onMouseMove={(e) => movePiece(e)} 
            onMouseDown={(e) => grabPiece(e)} 
            onMouseUp={(e) => dropPiece(e)}
            id="chessboard"
            ref={chessboardRef}
            >
                {board}
            </div>
}