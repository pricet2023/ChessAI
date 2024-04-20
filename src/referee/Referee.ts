import { paste } from "@testing-library/user-event/dist/paste";
import { PieceType, TeamType, Piece } from "../components/Chessboard/Chessboard";

export default class Referee {
    tileIsOccupied(x: number ,y: number, boardState: Piece[]): boolean
    {
        console.log("check if tile occupied");

        const piece = boardState.find(p => p.x === x && p.y === y);
        if (piece)
        {
            return true;
        } else {
            return false;
        }
    }

    tileIsOccupiedByOpponent(x: number, y: number, boardState: Piece[], team: TeamType) : boolean
    {
        const piece = boardState.find((p) => p.x === x && p.y === y && p.team !== team);

        if (piece)
        {
            return true;
        }
        else 
        {
            return false;
        }

    }

    isEnPassantMove(px : number, py : number ,x : number ,y : number, type: PieceType, team: TeamType, boardState: Piece[])
    {
        const pawnDirection =  (team == TeamType.OUR) ? 1 : -1;

        if (type === PieceType.PAWN)
        {
            if ((x - px === -1 || x - px === 1) && y - py === pawnDirection)
            {
                const piece = boardState.find((p) => p.x === x && p.y === y - pawnDirection && p.enPassant === true);
                if (piece)
                {
                    return true;
                }
            }
        }
        

        return false;

    }

    isValidMove(px : number, py : number ,x : number ,y : number, type: PieceType, team: TeamType, boardState: Piece[]) {
        console.log("Referee is checking move...");
        console.log(`Piece type: ${type}`);

        if (type === PieceType.PAWN)
        {
            const specialRow = (team === TeamType.OUR) ? 1 : 6;
            const pawnDirection = (team == TeamType.OUR) ? 1 : -1;

            //movement
            if (px === x && py === specialRow && y - py === 2*pawnDirection)
            {
                if (!this.tileIsOccupied(x, y, boardState) && !this.tileIsOccupied(x, y - pawnDirection, boardState)) {
                    return true;
                }
            } 
            else if (px === x && y - py === pawnDirection)
            {
                if (!this.tileIsOccupied(x, y, boardState)) {
                    return true;
                }
            }
            else if (x - px === -1 && y - py === pawnDirection)
            {
                //attack in upper or bottom left corner
                if (this.tileIsOccupiedByOpponent(x, y, boardState, team))
                {
                    return true;
                }

            }
            else if (x - px === 1 && y - py == pawnDirection)
            {
                //attack in upper or bottom right
                //attack in upper or bottom left corner
                if (this.tileIsOccupiedByOpponent(x, y, boardState, team))
                {
                    return true;
                }
            }


    
        }

        return false;
    }
}