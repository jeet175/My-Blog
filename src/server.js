import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';

const app = express();

console.log(path.join(__dirname, '/build'));
app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyParser.json());

// app.get('/hello', (req, res) => res.send('Helllo!'));
// app.post('/helloPost', (req, res) => res.send(`Hello post! ${req.body.name}`));
// app.post('/helloPostByParam/:name', (req, res) => res.send(`Hello post! ${req.params.name}`));

const withDB = async (operation, res) => {
    try {
        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true, useUnifiedTopology: true });
        const db = client.db('my-blog');

        await operation(db);

        client.close();
    } catch (error) {
        res.status(500).json({ message: 'Error conneting to db', error });
    }
}

app.get("/api/articles/:name", async (req, res) => {
    withDB(async (db) => {
        const articleName = req.params.name;

        const articleInfo = await db.collection('articles').findOne({ name: articleName });

        res.status(200).json(articleInfo);
    }, res)
});

app.post("/api/articles/:name/upvote", async (req, res) => {
    withDB(async (db) => {
        const articleName = req.params.name;

        let articleInfo = await db.collection('articles').findOne({ name: articleName });
        const upvotes = articleInfo.upvotes + 1;

        await db.collection('articles').updateOne({ name: articleName }, {
                                                '$set': {
                                                    upvotes: upvotes,
                                                },
                                                });

        articleInfo = await db.collection('articles').findOne({ name: articleName });                                      

        res.status(200).json(articleInfo);

     }, res)
});

app.post("/api/articles/:name/addcomment", (req, res) => {
    withDB(async (db) => {

    const { userName , text } = req.body;
    const articleName = req.params.name;

    let articleInfo = await db.collection('articles').findOne({ name: articleName });

    await db.collection('articles').updateOne({ name: articleName }, { 
                                                            '$set': {
                                                                comments: articleInfo.comments.concat({
                                                                    userName: userName,
                                                                    text: text,
                                                                })
                                                            }
                                              });

    articleInfo = await db.collection('articles').findOne({ name: articleName });

    res.status(200).json(articleInfo);
        
    }, res)
});

console.log(path.join(__dirname + '/build/index.html'));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
});

app.listen('8000', () => console.log('Server is listing on the port : 8000'));