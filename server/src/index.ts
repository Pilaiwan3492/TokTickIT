import { app } from "./app.js";
import { getJwtSecret } from "./utils/jwt.js";

// Validate mandatory environment configuration on server startup
getJwtSecret();

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`TokTickIT API listening on http://localhost:${PORT}`);
});
