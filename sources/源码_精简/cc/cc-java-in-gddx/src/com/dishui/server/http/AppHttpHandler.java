package com.dishui.server.http;

import java.io.IOException;
import java.net.URI;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.dishui.manager.command.C5Action;
import com.dishui.manager.command.C5Response;
import com.dishui.manager.command.JSONReader;
import com.dishui.manager.service.AppConfig;
import com.dishui.manager.service.Utils;
import com.dishui.net.httpserver.Headers;
import com.dishui.net.httpserver.HttpExchange;
import com.dishui.net.httpserver.HttpHandler;
import com.dishui.repaire.RepaireCustomerData;
import com.dishui.server.handler.*;

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
            e.printStackTrace();
            sendOK(e.getMessage(), exchange);
        }
    }
    private void processPost(HttpExchange exchange) throws Exception {
//		sendOK("Forbiden", exchange);
        String content_length = exchange.getRequestHeaders().get(
                "Content-length").get(0);

        int length = Integer.valueOf(content_length);
        byte[] data = new byte[2048];
        int count = 0;
        StringBuffer buffer = new StringBuffer();
        StringBuffer bufferOss = new StringBuffer();
        while ((count = exchange.getRequestBody().read(data)) != -1) {
            buffer.append(new String(data, 0, count, "UTF-8"));
            bufferOss.append(new String(data, 0, count, "gb2312"));
            length -= count;
        }
        if (length != 0) {
            log.warning("Imcompleted POST data! [" + buffer.toString() + "]");
            sendOK("Imcompleted POST data! [" + buffer.toString() + "]",
                    exchange);
            return;
        }
        String strData = buffer.toString();
        String strDataOss = bufferOss.toString();
        URI uri = exchange.getRequestURI();
        if (uri != null && uri.toString().trim().equals("/ossService")) {
            String error = "";
            String orderId = "";
            String seq = "";
            log.log(Level.INFO,"request from oss"+strDataOss);
            String res = OSSHandler.oss(strDataOss);
            if (res != null && res.indexOf(",") != -1) {
                error = res.split(",")[0];
                orderId = res.split(",")[1];
                seq = res.split(",")[2];
            } else {
                error = res;
                seq = "";
            }

            String code = "1";
            if (error.isEmpty()) {
                code = "0";
            }
            String result = "<?xml version=\"1.0\" encoding=\"gb2312\" ?>\n" +
                    "<wq_interface definition=\"WQ_DC\">\n" +
                    "<action name=\"2005\" seq=\""+seq+"\"> \n" +
                    "<confirmdata>\n" +
                    "\t<parameter name=\"确认标记\" code=\"result\" value=\""+code+"\" />\n" +
                    "\t<parameter name=\"异常原因\" code=\"ErrReason\" value=\""+error+"\" />\n" +
                    "</confirmdata>\n" +
                    "</action>\n" +
                    "</wq_interface>\n";
            sendOK(result, exchange);
            log.log(Level.INFO, "confirm to oss:" + result);
            Thread.sleep(1000);
            String url = "http://122.13.2.206:9090/WebServiceGW/wqInterfaceService";
            OSSHandler.sentPostOss(url,orderId,seq,code,error);
        } else {
            processPostData(strData, exchange);
        }
    }
    private void processPostData(String strData, HttpExchange exchange)
            throws Exception {
        String query = exchange.getRequestURI().getQuery();
        String[] params = query.split("&");
        HashMap<String, Object> map = new HashMap<String, Object>();
        if (params.length > 0) {
            for (int i = 0; i < params.length; i++) {
                String[] a = params[i].split("=");
                map.put(a[0].trim(), a[1].trim());
            }
        }

        try {
            JSONReader jsonReader = new JSONReader();
            HashMap<String, Object> map2 = (HashMap<String, Object>) jsonReader.read(strData);
            map.putAll(map2);
        } catch (Exception e1) {
            log.log(Level.WARNING, "Error action: " + strData, e1);
            C5Response response = new C5Response("", "", false);
            response.setMessage("400 Error action: " + strData);
            sendOK(response, exchange);
            return;
        }
        String actionName = map.get("Action").toString();
        C5Action action = new C5Action(actionName, Utils.getSynActionID(actionName));
        action.setValues(map);
        C5Response response = new C5Response(action);

        if (actionName.equals("km")) {
            response = KmHandler.handle(action);
        } else {
            String data = "unknow action!";
            sendOK(data, exchange);
            return;
        }
        sendOK(response, exchange);
    }
    private void processGet(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        String rrr = exchange.getRequestURI().getQuery();
        log.log(Level.INFO, "request from client:" + path + rrr);
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
                String val=a[1].trim();
                if(val!=null && val.indexOf("amp;")!=-1) {
                    val=val.replace("amp;","&");
                }
                map.put(a[0].trim(), val);
            }
        }
        String actionName = map.get("Action");
        C5Action action = new C5Action(actionName, Utils.getSynActionID(actionName));
        action.setValues(map);
        C5Response response = new C5Response(action);
        if (actionName.equals("getSipNum")) {
            response = AppServiceHander.getSipNum(action);
        } else if (actionName.equals("getSeriesSipNum")) {
            response = AppServiceHander.getSeriesSipNum(action);
        } else if (actionName.equals("getSkillGroupNum")) {
            response = AppServiceHander.getSkillGroupNum(action);
        } else if (actionName.equals("getIvrId")) {
            response = AppServiceHander.getIvrId(action);
        } else if (actionName.equals("getAccountId")) {
            response = AppServiceHander.getAccountId(action);
        } else if (actionName.equals("getBusinessNum")) {
            response = AppServiceHander.getBusinessNum(action);
        } else if (actionName.equals("useServiceNum")) {
            response = AppServiceHander.useServiceNum(action);
        } else if (actionName.equals("releaseServiceNum")) {
            response = AppServiceHander.releaseServiceNum(action);
        } else if (actionName.equals("export")) {
            response = ExportHandler.handle(action);
        } else if (actionName.equals("import")) {
            response = ImportHandler.handle(action);
        } else if (actionName.equals("taobao")) {
            response = AppServiceHander.taobao(action);
        } else if (actionName.equals("km")) {
            response = KmHandler.handle(action);
        } else if (actionName.equals("img")) {
            response = ImgHandler.handle(action);
        } else if (actionName.equals("loadNotify")) {
            response = LoadNotifyHandler.handle(action);
        } else if (actionName.equals("repairMail")) {
//            response = RepaireCustomerData.repairMail(action);
        } else if (actionName.equals("deleteCustomer")) {
            response = DeleteCustomerHandler.deleteCustomer(action);
        } else if (actionName.equals("didiMonitor")) {
            response = DidiMonitorHandler.getData(action);
        } else if (actionName.equals("accountMonitor")) {
            response = DidiMonitorHandler.getAccountData(action);
        } else if (actionName.equals("didiCityAccount")) {
            response = DidiMonitorHandler.getDidiCityAccounts(action);
        } else if (actionName.equals("accountAssChannelCount")) {
            response = DidiMonitorHandler.updateAccountCount(action);
        } else if (actionName.equals("didiLinkRate")) {
            response = DidiMonitorHandler.getLinkRateData(action);
        } else if (actionName.equals("didiAssChannelCount")) {
            response = DidiMonitorHandler.updateCount(action);
        } else if(actionName.equals("archiveCustomer")){
            response = ArchiveCustomerHandler.archiveCustomer(action);
        } else if(actionName.equals("updateCustSample")){
            response = UpdateCustSampleHandler.updateCustSample(action);
        } else if(actionName.equals("didiBindGrayScale")){
            response = DidiMonitorHandler.getBindGrayScale(action);
        } else if(actionName.equals("didiUpdateBGS")){
            response = DidiMonitorHandler.updateBGSByCityId(action);
        } else if(actionName.equals("didiNumberSourceCities")){
            response = DidiMonitorHandler.didiNSCities(action);
        } else if(actionName.equals("getNumSegmentByCityId")){
            response = DidiMonitorHandler.getNumSegmentByCityId(action);
        } else if(actionName.equals("addNumberSourceWithCityId")){
            response = DidiMonitorHandler.addNumberSourceWithCityId(action);
        } else if(actionName.equals("maxBindCountModify")){
            response = DidiMonitorHandler.modifyMaxBindCount(action);
        } else if (actionName.equals("fjxhQuery")) {
            response = FjdxXiaoHaoHandler.fjxhQuery(action);
        } else if (actionName.equals("fjxhBind")) {
            response = FjdxXiaoHaoHandler.fjxhBind(action);
        } else if (actionName.equals("fjxhDial")) {
            response = FjdxXiaoHaoHandler.fjxhDial(action);
        } else if (actionName.equals("fjxhClose")) {
            response = FjdxXiaoHaoHandler.fjxhClose(action);
        } else if (actionName.equals("dialInfoCallBack")) {
            String responseStr = FjdxXiaoHaoHandler.dialInfoCallBack(action);
            sendOK(responseStr, exchange);
            return;
        } else if (actionName.equals("dialRecordCallBack")) {
            String responseStr = FjdxXiaoHaoHandler.dialRecordCallBack(action);
            sendOK(responseStr, exchange);
            return;
        } else if (actionName.equals("callStateCallBack")) {
            String responseStr = FjdxXiaoHaoHandler.callStateCallBack(action);
            sendOK(responseStr, exchange);
            return;
        } else if (actionName.equals("uberAssChannelCount")) {
            response = DidiMonitorHandler.uberUpdateCount(action);
        } else if(actionName.equals("uberMonitor")){
            response = DidiMonitorHandler.getUberData(action);
        } else {            String data = "unknow action!";
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
            byte[] toSend;
            String callbackName = (String) exchange.getVar("callbackName");
            if (callbackName != null) {
                data = callbackName + "(" + data + ")";
                exchange.setVar("callbackName", null);
            }
            Headers responseHeaders = exchange.getResponseHeaders();
            if (exchange != null && exchange.getRequestURI() != null &&
                    exchange.getRequestURI().toString().trim().equals("/ossService")) {
                responseHeaders.set("Content-Type", "text/xml");
                toSend = data.getBytes("gb2312");
            } else {
                responseHeaders.set("Content-Type", "text/plain");
                toSend = data.getBytes("UTF-8");
            }

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
