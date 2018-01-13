'use strict';

const http = require('http');
const fs = require('mz/fs');
const url = require('url');
const Koa = require('koa');
const {EventEmitter} = require('events');

const app = new Koa();
const Router = require('koa-router');
const router = new Router();


const dispatcher = new EventEmitter();

router.get('/', async (ctx, next) => {

    ctx.body = await  fs.readFile('index.html', 'utf-8' );

    await next();
});

router.get('/subscribe', async (ctx, next) => {
    
    await new Promise ((resolve, reject) => {
        dispatcher.once('message', (message) => {
            ctx.body = message;
            resolve();
        })
    });
 
    await next();
})

router.post('/publish', async (ctx, next) => {
    await new Promise((resolve, reject) => {
        let data = '';
        ctx.req
            .on('data', chunk => {
              data += chunk;
              if (data.length > 512) {
                ctx.status = 413;
                reject();
            }
          
            })
            .on('end', () => {
                if (ctx.status == 413) {
                    return;
                }
                data = JSON.parse(data);
                dispatcher.emit('message', data.message);
                ctx.body = 'ok';
                resolve();
            })
    //i'm not so sure about that!!!
    }).catch(err => ctx.status = 413) 
    

    await next();
})

app.use(router.routes())
app.listen(3000);