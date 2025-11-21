import { serve } from "https://deno.land/std@0.181.0/http/server.ts";

serve(async (req) => {
  try {
    const url = new URL(req.url);

    // 1. 锁定 Google 官方地址
    url.host = "generativelanguage.googleapis.com";
    url.protocol = "https:";
    url.port = "443";

    // 2. 【核心修改】强制使用 v1alpha 版本
    // Gemini 3.0 Preview 通常只在 alpha 通道可用
    // 我们把所有的 /v1beta 或者是没有版本的路径，统统改成 /v1alpha
    let path = url.pathname;
    
    // 如果自带了 v1beta，把它替换掉
    if (path.includes("/v1beta")) {
      path = path.replace("/v1beta", "/v1alpha");
    } 
    // 如果没有版本号，手动加上 v1alpha
    else if (!path.startsWith("/v1alpha")) {
       if (path.startsWith("/")) {
         path = "/v1alpha" + path;
       } else {
         path = "/v1alpha/" + path;
       }
    }
    url.pathname = path;

    // 3. 清理 Header
    const headers = new Headers(req.headers);
    headers.delete("host");
    headers.delete("x-forwarded-for");

    // 4. 发送请求
    const proxyReq = new Request(url.toString(), {
      method: req.method,
      headers: headers,
      body: req.body,
      redirect: "follow",
    });

    const response = await fetch(proxyReq);

    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" }
    });
  }
});
