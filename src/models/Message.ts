import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { TIME_FORMAT } from '../constants/constants.js';
import { MsgJSON } from '../api/socketAPI.js';

export class Message{
    msg: string;
    date: string;
    username: string;

    constructor(msg: string, username: string){
        this.msg = msg;
        this.username = username;
        this.date = format(new Date(), TIME_FORMAT, { locale: es });
    }

    toJSON(): MsgJSON{
        return {
            msg: this.msg,
            date: this.date,
            username: this.username
        }
    }

}