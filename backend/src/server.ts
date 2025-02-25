import express from "express";
import { Queue, Worker, Job, QueueEvents } from "bullmq";
import { createServer } from "http";
import dotenv from "dotenv";
import { createClient } from "redis";
import cors from "cors";
import { randomUUID } from "crypto";
dotenv.config();

interface Order {
  jobId: string;
  status: string;
  result: any;
}
const database: Record<string, Order> = {};

const app = express();
const server = createServer(app);

app.use(cors());
app.use(express.json());

const redisConfig = { connection: { host: "localhost", port: 6379 } };
const queue = new Queue("orderQueue", redisConfig);
const queueEvents = new QueueEvents("orderQueue", redisConfig);

const redisClient = createClient();
redisClient.connect();

app.post("/order", async (req, res) => {
  const pedido = req.body;
  const jobId = randomUUID();

  await queue.add("processOrder", pedido, { jobId });

  database[jobId] = { jobId, status: "Em processamento", result: null };

  res.status(202).json({ success: true, jobId });
});

app.get("/order/:jobId", async (req: any, res: any) => {
  const { jobId } = req.params;

  const order = database[jobId];
  console.log(order);
  if (!order) {
    return res.status(404).json({ error: "Pedido não encontrado" });
  }

  res.json(order);
});

const worker = new Worker(
  "orderQueue",
  async (job: Job) => {
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const result = { ...job.data, status: "Pedido processado com sucesso" };

    const order = database[job.id!];
    if (order) {
      order.status = "Processado";
      order.result = result;
    }

    await redisClient.publish(
      "orderProcessed",
      JSON.stringify({ jobId: job.id, result })
    );

    return result;
  },
  redisConfig
);

redisClient.subscribe("orderProcessed", (message) => {});

const port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});
