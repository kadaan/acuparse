import { Condition } from './condition';

export class FiveInOneCondition extends Condition {
    windspeedmph: number;
    winddir: number;
    windgustmph: number;
    windgustdir: number;
    windspeedavgmph: number;
    heatindex: number;
    feelslike: number;
    windchill: number;
    dailyrainin: number;
    rainin: number;

    constructor(body?: any) {
        super(body);
        if (body) {
            this.windspeedmph = Number(body.windspeedmph);
            this.winddir = Number(body.winddir);
            this.windgustmph = Number(body.windgustmph);
            this.windgustdir = Number(body.windgustdir);
            this.windspeedavgmph = Number(body.windspeedavgmph);
            this.heatindex = Number(body.heatindex);
            this.feelslike = Number(body.feelslike);
            this.windchill = Number(body.windchill);
            this.dailyrainin = Number(body.dailyrainin);
            this.rainin = Number(body.rainin);
        }
    }
}