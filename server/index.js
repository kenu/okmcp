const express = require('express');
const app = express();
app.use(express.json());

// 도구 정의
const tools = {
  calculator: {
    add: (a, b) => a + b,
    subtract: (a, b) => a - b,
    multiply: (a, b) => a * b,
    divide: (a, b) => a / b
  },
  weather: {
    getTemperature: (city) => {
      // 실제 구현에서는 날씨 API 호출
      return `${city}의 현재 온도는 22°C입니다.`;
    }
  }
};

// MCP 엔드포인트
app.post('/mcp', (req, res) => {
  const { tool, method, params } = req.body;
  
  if (!tools[tool] || !tools[tool][method]) {
    return res.status(400).json({ error: '유효하지 않은 도구 또는 메서드' });
  }
  
  try {
    const result = tools[tool][method](...params);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('MCP 서버가 포트 3000에서 실행 중입니다.');
});
