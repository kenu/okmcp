import requests

class MCPClient:
    def __init__(self, server_url):
        self.server_url = server_url
        
    def call_tool(self, tool, method, params):
        payload = {
            "tool": tool,
            "method": method,
            "params": params
        }
        
        response = requests.post(
            f"{self.server_url}/mcp", 
            json=payload
        )
        
        if response.status_code == 200:
            return response.json()["result"]
        else:
            error = response.json().get("error", "알 수 없는 오류")
            raise Exception(f"MCP 호출 실패: {error}")

# 사용 예시
client = MCPClient("http://localhost:3000")
result = client.call_tool("calculator", "add", [5, 3])
print(f"5 + 3 = {result}")  # 출력: 5 + 3 = 8

weather = client.call_tool("weather", "getTemperature", ["서울"])
print(weather)  # 출력: 서울의 현재 온도는 22°C입니다.
