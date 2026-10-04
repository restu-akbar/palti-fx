import { app } from './app';
import { config } from './config';

app.listen(config.port, () => {
  console.log(`===============================================`);
  console.log(`🚀 PALTI FX Backend API Server is running!`);
  console.log(`📡 URL: http://localhost:${config.port}`);
  console.log(`🩺 Health: http://localhost:${config.port}/health`);
  console.log(`🔐 API Base: http://localhost:${config.port}/api/v1`);
  console.log(`⚙️  Environment: ${config.nodeEnv}`);
  console.log(`===============================================`);
});
