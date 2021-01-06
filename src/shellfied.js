const shellfie = require('shellfie');
const express = require('express');
const bodyParser = require("body-parser");
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use('/', express.static(path.join(__dirname, '../static')));

const name = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
app.post('/json', bodyParser.json(), async (req, res) => {
    if (!req.body) return res.json({ error: 'must set body' }).status(400);
    if (!req.body.data) return res.json({ error: 'must provide data' }).status(400);

    const { body } = req;
    const { data, ext } = body;
    const extension = ext || 'png';
    const imgPath = path.resolve(`./shellfies/${name}.png`);
    const config = { ...body, name, ext: extension };
    
    try {
        await shellfie(data, config);
        res.sendFile(imgPath);
        await fs.rm(imgPath)
    } catch (error) {
        throw error;
    }
});


app.post('/text', bodyParser.text({type: "*/*"}), async (req, res) => {
    if (!req.body) return res.json({ error: 'must set body' }).status(400);
    const { body } = req;
    const config = { name, mode: 'raw' };
    const imgPath = path.resolve(`./shellfies/${name}.png`);
    try {
        await shellfie(body, config);
        res.sendFile(imgPath);
        await fs.rm(imgPath)
    } catch (error) {
        throw error;
    }
});

app.listen(port, () => {
    console.log(`\x1b[32mshellfied server running on \x1b[95m${port}\x1b[0m`);
});
