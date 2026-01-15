const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const app = express();
const server = http.createServer(app);

app.use(express.json());

// 도구 정의
const tools = {
  calculator: {
    name: "calculator",
    description: "기본적인 계산을 수행합니다",
    methods: {
      add: {
        description: "두 숫자를 더합니다",
        parameters: {
          type: "array",
          items: { type: "number" },
          minItems: 2,
          maxItems: 2
        }
      },
      subtract: {
        description: "두 숫자를 뺍니다",
        parameters: {
          type: "array",
          items: { type: "number" },
          minItems: 2,
          maxItems: 2
        }
      },
      multiply: {
        description: "두 숫자를 곱합니다",
        parameters: {
          type: "array",
          items: { type: "number" },
          minItems: 2,
          maxItems: 2
        }
      },
      divide: {
        description: "두 숫자를 나눕니다",
        parameters: {
          type: "array",
          items: { type: "number" },
          minItems: 2,
          maxItems: 2
        }
      }
    }
  },
  weather: {
    name: "weather",
    description: "날씨 정보를 제공합니다",
    methods: {
      getTemperature: {
        description: "도시의 현재 온도를 반환합니다",
        parameters: {
          type: "array",
          items: { type: "string" },
          minItems: 1,
          maxItems: 1
        }
      }
    }
  }
};

// 도구 실행 함수
function executeTool(toolName, methodName, params) {
  if (!tools[toolName]) {
    throw new Error(`도구 '${toolName}'를 찾을 수 없습니다`);
  }
  
  if (!tools[toolName].methods[methodName]) {
    throw new Error(`메서드 '${methodName}'를 찾을 수 없습니다`);
  }
  
  switch (toolName) {
    case 'calculator':
      const [a, b] = params;
      switch (methodName) {
        case 'add': return a + b;
        case 'subtract': return a - b;
        case 'multiply': return a * b;
        case 'divide': 
          if (b === 0) throw new Error('0으로 나눌 수 없습니다');
          return a / b;
        default: throw new Error(`알 수 없는 계산기 메서드: ${methodName}`);
      }
    case 'weather':
      switch (methodName) {
        case 'getTemperature':
          const city = params[0];
          // 실제 구현에서는 날씨 API 호출
          return `${city}의 현재 온도는 ${Math.floor(Math.random() * 15) + 15}°C입니다.`;
        default: throw new Error(`알 수 없는 날씨 메서드: ${methodName}`);
      }
    default:
      throw new Error(`알 수 없는 도구: ${toolName}`);
  }
}

// 헬스 체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 도구 목록 엔드포인트
app.get('/tools', (req, res) => {
  const toolList = Object.values(tools).map(tool => ({
    name: tool.name,
    description: tool.description,
    methods: Object.keys(tool.methods)
  }));
  
  res.json({ tools: toolList });
});

// 기존 MCP 엔드포인트 (하위 호환성)
app.post('/mcp', (req, res) => {
  const { tool, method, params } = req.body;
  
  try {
    const result = executeTool(tool, method, params);
    res.json({ result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 새로운 MCP 표준 엔드포인트
app.post('/mcp/v2', (req, res) => {
  const { jsonrpc, id, method, params } = req.body;
  
  if (jsonrpc !== "2.0") {
    return res.status(400).json({
      jsonrpc: "2.0",
      id,
      error: { code: -32600, message: "Invalid Request" }
    });
  }
  
  try {
    let result;
    
    switch (method) {
      case "initialize":
        result = {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: "okmcp-server",
            version: "1.0.0"
          },
          session_id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        break;
        
      case "tools/list":
        result = {
          tools: Object.values(tools).map(tool => ({
            name: tool.name,
            description: tool.description
          }))
        };
        break;
        
      case "tools/call":
        const { name, arguments: args } = params;
        result = executeTool(name, args.method, args.params);
        break;
        
      default:
        throw new Error(`알 수 없는 메서드: ${method}`);
    }
    
    res.json({
      jsonrpc: "2.0",
      id,
      result
    });
    
  } catch (error) {
    res.status(400).json({
      jsonrpc: "2.0",
      id,
      error: { code: -32603, message: error.message }
    });
  }
});

// WebSocket 서버 설정
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  console.log('WebSocket 클라이언트 연결됨');
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      const { jsonrpc, id, method, params } = message;
      
      if (jsonrpc !== "2.0") {
        ws.send(JSON.stringify({
          jsonrpc: "2.0",
          id,
          error: { code: -32600, message: "Invalid Request" }
        }));
        return;
      }
      
      let result;
      
      switch (method) {
        case "initialize":
          result = {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: "okmcp-server",
              version: "1.0.0"
            },
            session_id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          };
          break;
          
        case "tools/list":
          result = {
            tools: Object.values(tools).map(tool => ({
              name: tool.name,
              description: tool.description
            }))
          };
          break;
          
        case "tools/call":
          const { name, arguments: args } = params;
          result = executeTool(name, args.method, args.params);
          break;
          
        default:
          throw new Error(`알 수 없는 메서드: ${method}`);
      }
      
      ws.send(JSON.stringify({
        jsonrpc: "2.0",
        id,
        result
      }));
      
    } catch (error) {
      ws.send(JSON.stringify({
        jsonrpc: "2.0",
        id: message.id,
        error: { code: -32603, message: error.message }
      }));
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket 클라이언트 연결 종료');
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket 오류:', error);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`MCP 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`HTTP: http://localhost:${PORT}`);
  console.log(`WebSocket: ws://localhost:${PORT}/ws`);
});
