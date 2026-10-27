package com.m7.mailServer.http;

import com.dishui.command.C5Action;
import com.dishui.command.C5Response;
import com.dishui.net.httpserver.Headers;
import com.dishui.net.httpserver.HttpExchange;
import com.dishui.net.httpserver.HttpHandler;
import com.dishui.util.Utils;
import com.m7.mailServer.AppConfig;
import com.m7.mailServer.handler.MailHandler;
import com.m7.mailServer.handler.UserHandler;

import java.io.IOException;
import java.util.Hashtable;
import java.util.logging.Level;
import java.util.logging.Logger;

public class AppHttpHandler implements HttpHandler {
    private static final Logger log = Logger.getLogger(AppHttpHandler.class.getName());

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String requestMethod = exchange.getRequestMethod();
        try {
            if (requestMethod.equalsIgnoreCase("GET")) {
                processGet(exchange);
            } else if (requestMethod.equalsIgnoreCase("POST")) {
                processPost(exchange);
            }
        } catch (Exception e) {
            log.log(Level.WARNING, "handle http request has exception!", e);
            sendOK(e.getMessage(), exchange);
        }
    }

    private void processPost(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        log.log(Level.INFO, "request from client:" + path);

        String content_length = exchange.getRequestHeaders()
                .get("Content-length").get(0);
        int length = Integer.valueOf(content_length);
        byte[] data = new byte[1024];
        int count = 0;
        StringBuffer buffer = new StringBuffer();
        while ((count = exchange.getRequestBody().read(data)) != -1) {
            buffer.append(new String(data, 0, count, "UTF-8"));
            length -= count;
        }
        if (length != 0) {
            log.warning("Imcompleted POST data! [" + buffer.toString() + "]");
            sendOK("204", exchange);
            return;
        }

        if (path.endsWith("mail")) {
            log.info("mail:" + buffer.toString());
            String response = MailHandler.handle(buffer.toString());
            sendOK(response,exchange);
            return;
        } else if (path.endsWith("user")) {
            log.info("user:" + buffer.toString());
            String response = UserHandler.handle(buffer.toString());
            sendOK(response, exchange);
            return;
        } else {
            sendOK("Forbiden", exchange);
            return;
        }
//        processString(buffer.toString(), exchange);
    }

    private void processGet(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        String rrr = exchange.getRequestURI().getQuery();
        log.log(Level.INFO, "request from client:" + path + ' ' + rrr);
        if (path.endsWith("service")) {
            processService(exchange);
            return;
        } else {
            String data = AppConfig.serverName + AppConfig.version;
            sendOK(data, exchange);
            return;
        }
    }

    private void processService(HttpExchange exchange) throws IOException {
        String strData = exchange.getRequestURI().getQuery();
        String[] params = strData.split("\\&");
        Hashtable<String, String> map = new Hashtable<String, String>();
        if (params.length > 0) {
            for (int i = 0; i < params.length; i++) {
                String[] a = params[i].split("=");
                map.put(a[0].trim(), a[1].trim());
            }
        }
        String actionName = map.get("Action");
        C5Action action = new C5Action(actionName, Utils.getSynActionID(actionName));
        action.setValues(map);
        C5Response response = new C5Response(action);
        if (actionName.equals("getSipNum")) {
//            response = AppServiceHander.getSipNum(action);
        } else {
            String data = "unknow action!";
            sendOK(data, exchange);
            return;
        }
        sendOK(response, exchange);
    }

    public static void sendOK(C5Response response, HttpExchange exchange) throws IOException {
        String data = response.getJsonString();
        log.log(Level.INFO, "response to client:" + data);
        sendOK(data, exchange);
    }

    public static void sendOK(String data, HttpExchange exchange) throws IOException {
        try {
            log.log(Level.INFO, "response to client:" + data);
            String callbackName = (String) exchange.getVar("callbackName");
            if (callbackName != null) {
                data = callbackName + "(" + data + ")";
                exchange.setVar("callbackName", null);
            }
            Headers responseHeaders = exchange.getResponseHeaders();
            responseHeaders.set("Content-Type", "text/plain");
            byte[] toSend = data.getBytes("UTF-8");
            responseHeaders.set("Content-Length", toSend.length + "");
            exchange.sendResponseHeaders(200, 0);
            exchange.getResponseBody().write(toSend);
            exchange.getResponseBody().flush();
            exchange.getResponseBody().close();
        } catch (Exception e) {
            // log.log(Level.WARNING, "", e);
        } finally {
            exchange.close();
        }
    }

    public static void send403(String data, HttpExchange exchange) throws IOException {
        try {
            String callbackName = (String) exchange.getVar("callbackName");
            if (callbackName != null) {
                data = callbackName + "(" + data + ")";
                exchange.setVar("callbackName", null);
            }
            Headers responseHeaders = exchange.getResponseHeaders();
            responseHeaders.set("Content-Type", "text/plain");
            byte[] toSend = data.getBytes("UTF-8");
            responseHeaders.set("Content-Length", toSend.length + "");
            exchange.sendResponseHeaders(403, 0);
            exchange.getResponseBody().write(toSend);
            exchange.getResponseBody().flush();
            exchange.getResponseBody().close();
        } catch (Exception e) {
            // log.log(Level.WARNING, "", e);
        } finally {
            exchange.close();
        }
    }

    public static void send(int type, String data, HttpExchange exchange) throws IOException {
        try {
            String callbackName = (String) exchange.getVar("callbackName");
            if (callbackName != null) {
                data = callbackName + "(" + data + ")";
                exchange.setVar("callbackName", null);
            }
            Headers responseHeaders = exchange.getResponseHeaders();
            responseHeaders.set("Content-Type", "text/plain");
            byte[] toSend = data.getBytes("UTF-8");
            responseHeaders.set("Content-Length", toSend.length + "");
            exchange.sendResponseHeaders(type, 0);
            exchange.getResponseBody().write(toSend);
            exchange.getResponseBody().flush();
            exchange.getResponseBody().close();
        } catch (Exception e) {
            // log.log(Level.WARNING, "", e);
        } finally {
            exchange.close();
        }
    }

}
