const shellfie = require('shellfie');
const express = require('express');
const bodyParser = require("body-parser");
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const port = process.env.PORT || 3000;
app.use(cors());

app.post('/json', bodyParser.json(), async (req, res) => {
    if (!req.body) return res.json({ error: 'must set body' }).status(400);
    if (!req.body.data) return res.json({ error: 'must provide data' }).status(400);

    const { body } = req;
    const { name, data, ext } = body;
    const extension = ext || 'png';

    const location = path.resolve(__dirname, '../');
    const imgName = name || generateId();
    const imgPath = `${location}/${imgName}.${extension}`;
    const config = { ...body, location, name: imgName, ext: extension };

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

    const location = path.resolve(__dirname, '../');
    const imgName = generateId();
    const imgPath = `${location}/${imgName}.png`;
    const config = { ...body, location, name: imgName };

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

function generateId() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let result = '';

    for (var i = 0; i < 7; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
