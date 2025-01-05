import express, { Express } from 'express';
import bodyParser, { json } from 'body-parser';
import 'dotenv/config';
import cors from 'cors';
import authRouter from '@/routes/auth/auth.router';
import errorHandle from '@/middlewares/errorHandle';

const app: Express = express();
const port = process.env.PORT;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(express.json());
app.use(
  cors({
    origin: '*',
  }),
);
app.use(json());

app.use('/api', [
  authRouter,
]);
app.use(errorHandle);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
