import 'reflect-metadata';
import 'es6-shim';
import * as express from 'express';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import {Condition} from './dto/condition';
import {TowerCondition} from './dto/towerCondition';
import {FiveInOneCondition} from './dto/fiveInOneCondition';
import {EmbeddedHtml} from './dto/embeddedHtml';
import * as ct from 'class-transformer';
import * as querystring from 'querystring';


const STATUS_OK = 200;
const STATUS_BAD_REQUEST = 400;
const CURRENT_CONDITION_COLLECTION = 'current_conditions';
const OEMBED_FORMAT_JSON = 'json';
const OEMBED_FORMAT_XML = 'xml';

admin.initializeApp(functions.config().firebase);

const db = admin.firestore();

const app = express();
app.disable('x-powered-by');
app.use(express.urlencoded());

app.get('/condition', async function recordCondition(req: express.Request, res: express.Response) {
    const conditions: Condition[] = [];
    const querySnapshot = await db.collection(CURRENT_CONDITION_COLLECTION).limit(1000).get();
    querySnapshot.forEach(function(doc) {
        const data = doc.data();
        switch (data.mt) {
            case "5N1":
                conditions.push(ct.plainToClass(FiveInOneCondition, data));
                break;
            case "tower":
                conditions.push(ct.plainToClass(TowerCondition, data));
                break;
            default:
                console.error(`Unsupported condition type: ${req.body.mt}`);
                res.status(STATUS_BAD_REQUEST).send("Unsupported condition type");
                return;
        }
    })
    res.status(STATUS_OK).send(conditions)
});

app.post('/condition', async function recordCondition(req: express.Request, res: express.Response) {
    if (!req.is('application/x-www-form-urlencoded')) {
        console.error(`Unsupported content-type: ${req.get('content-type')}`);
        res.status(STATUS_BAD_REQUEST).send('Unsupported content-type');
    } else {
        let condition: Condition;
        switch (req.body.mt) {
            case "5N1":
                console.log('Detected 5N1 source');
                condition = new FiveInOneCondition(req.body);
                break;
            case "tower":
                console.log('Detected Tower source');
                condition = new TowerCondition(req.body);
                break;
            default:
                console.error(`Unsupported condition type: ${req.body.mt}`);
                res.status(STATUS_BAD_REQUEST).send("Unsupported condition type");
                return;
        }
        console.log(`Writing current conditions for ${condition.getCurrentPath()}`);
        await db.collection(CURRENT_CONDITION_COLLECTION).doc(condition.getCurrentPath()).set(ct.classToPlain(condition));
        res.status(STATUS_OK).send();
    }
});

function sendEmbeddedHtml(req: express.Request, res: express.Response, html: EmbeddedHtml) {
    switch (req.query.format || OEMBED_FORMAT_JSON) {
        case OEMBED_FORMAT_JSON:
            respondJson(req, res, html);
            break;
        case OEMBED_FORMAT_XML:
            respondXml(req, res, html);
            break;
        default:
            console.error(`Unsupported oEmbed format: ${req.query.format}`);
            res.status(STATUS_BAD_REQUEST).send("Unsupported oEmbed format");
            return;
    }
}

function respondJson(req: express.Request, res: express.Response, html: EmbeddedHtml) {
    const callback = req.query.callback || req.query.jsonp;
    if (callback) {
        const output = `${callback}(${html.toJSONString()});`;
        res.status(STATUS_OK)
            .header('Content-type', 'application/javascript')
            .send(output);
        return;
    }

    res.status(STATUS_OK)
        .header('Content-type', 'application/json')
        .send(html.toJSONString());
}

function respondXml(req: express.Request, res: express.Response, html: EmbeddedHtml) {
    res.status(STATUS_OK)
        .header('Content-type', 'text/xml')
        .send(html.toXMLString());
}

function getTempIcon(temp: number): string {
    if (temp < 14) {
        return 'fa-thermometer-empty';
    }
    if (temp <= 32) {
        return 'fa-thermometer-quarter';
    }
    if (temp < 59) {
        return 'fa-thermometer-half';
    }
    if (temp <= 86) {
        return 'fa-thermometer-three-quarters';
    }
    return 'fa-thermometer-full';
}

async function getCurrentConditionsHtml(): Promise<string> {
    const querySnapshot = await db.collection(CURRENT_CONDITION_COLLECTION)
        .where('mt', '==', '5N1')
        .limit(1)
        .get();
    const data = ct.plainToClass(FiveInOneCondition, querySnapshot.docs[0].data());
    return `<body>
    <section id="weather_data">
        <div class="row row_weather_data">
            <div class="row row_temperature_data">
                <h2><i class="fa ${getTempIcon(data.tempf)}" aria-hidden="true"></i> Temperature:</h2><h4>${data.tempf}&#8457;</h4>
            </div>
        </div>
    </section>
</body>`;
}

app.get('/oembed', async function recordCondition(req: express.Request, res: express.Response) {
    if (!req.query.url) {
        console.error('Missing oEmbed url');
        res.status(STATUS_BAD_REQUEST).send("Missing oEmbed url");
        return;
    }

    const contents = `<html>
   <body>
        ${await getCurrentConditionsHtml()}
    </body>    
</html>`;

    const embeddedhtml = new EmbeddedHtml("Current Weather", contents, 100, 100);
    sendEmbeddedHtml(req, res, embeddedhtml);
})

app.get('/condition/ui', async function recordCondition(req: express.Request, res: express.Response) {
    const url = req.protocol + '://' + req.get('host') + req.originalUrl;
    const contents = `<html>
    <head>
        <link rel="alternate" type="application/json+oembed" href="${req.baseUrl}/oembed?${querystring.stringify({url: url, format: 'json'})}" title="Current Conditions" />
        <link rel="alternate" type="text/xml+oembed" href="${req.baseUrl}/oembed?${querystring.stringify({url: url, format: 'xml'})}" title="Current Conditions" />
    </head>
    <body>
        ${await getCurrentConditionsHtml()}
    </body>    
</html>`;

    res.status(STATUS_OK).send(contents);
});

exports.api = functions.https.onRequest(app);