import {Exclude, Type} from "class-transformer";

export abstract class Condition {
    @Type(() => Date)
    date: Date;
    id: string;
    mt: string;
    sensor: string;
    sensorbattery: string;
    rssi: string;
    hubbattery: string;
    baromin: number;
    humidity: number;
    tempf: number;
    dewptf: number;

    protected constructor(body?: any) {
        if (body) {
            this.date = new Date(body.date);
            this.id = body.id;
            this.mt = body.mt;
            this.sensor = body.sensor;
            this.sensorbattery = body.sensorbattery;
            this.rssi = body.rssi;
            this.hubbattery = body.hubbattery;
            this.baromin = Number(body.baromin);
            this.humidity = Number(body.humidity);
            this.tempf = Number(body.tempf);
            this.dewptf = Number(body.dewptf);
        }
    }

    @Exclude()
    getCurrentPath(): string {
        return this.id;
    }
}