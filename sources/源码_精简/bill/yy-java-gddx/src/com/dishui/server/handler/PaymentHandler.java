package com.dishui.server.handler;

import com.alipay.config.AlipayConfig;
import com.alipay.util.AlipayNotify;
import com.alipay.util.AlipaySubmit;
import com.dishui.bill.command.C5Action;
import com.dishui.bill.command.C5Response;
import com.dishui.bill.command.Fields;
import com.dishui.bill.command.JSONReader;
import com.dishui.bill.service.AppConfig;
import com.dishui.bill.service.Utils;
import com.dishui.db.mango.MongoProvider;
import com.dishui.util.DateUtil;
import com.dishui.util.IDGenerator;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.net.URLDecoder;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;

public class PaymentHandler {
    private static Logger log = Logger.getLogger(PaymentHandler.class.getName());
    private static String TB_USER_PAY = "user_pay";
    private static String TB_Bill_USER_BANK_PAY = "bill_user_bank_pay";
    private static final String PAY_SUBJECT="用户中心充值";
    private static final String PAY_NOTIFY= AppConfig.getInstance().getVar("pay.notify");

    private static Timer payTimer = null;
    private static String endAccTime = "2015-07-04 00:00:00";
    public static C5Response handle(C5Action action) {
        C5Response response = new C5Response(action);
        try {
            String method = action.getStringValue(Fields.Method);
            String json = action.getStringValue("params");
            HashMap<String, Object> map = new HashMap<String, Object>();
            if(json!=null){
                json = URLDecoder.decode(json, "UTF-8");
                JSONReader jsonReader = new JSONReader();
                map = (HashMap<String, Object>) jsonReader.read(json);
            }
            if(method.equalsIgnoreCase("PaymentAdd")){
                String accountId = action.getStringValue(Fields.Account);
                Map<String,Object> params=map;
                String company =getAccountCompany(accountId);
                String bank = (String)params.get("bank");
                String orderNo= IDGenerator.getNext(6);
                params.put("orderNo", orderNo);
                insertBankPay(params,accountId);
                String html="";
                log.info("PaymentAdd accountId:"+accountId+" company=="+company);
                if("alipay".equals(bank)){
                    html=aliPay(params,company);
                }else{
                    html=aliBankPay(params,company);
                }
                response.addParameter("html", html);
                response.setSucceed(true);
            }else if(method.equalsIgnoreCase("BillPaymentAdd")){
                Map<String,Object> params=map;
                String bank = (String)params.get("bank");
                String proxy = (String)params.get("proxy");
                String company =getProxyCompany(proxy);
                String orderNo= IDGenerator.getNext(6);
                params.put("orderNo", "BP"+orderNo);
                insertBillBankPay(params);
                String html="";
                log.info("BillPaymentAdd proxy:"+proxy+" company=="+company);
                if("alipay".equals(bank)){
                    html=aliPay(params,company);
                }else{
                    html=aliBankPay(params,company);
                }
                response.addParameter("html", html);
                response.setSucceed(true);
            }else if(method.equalsIgnoreCase("PaymentContiue")){  //已废
/*				String orderNo = action.getStringValue("orderNo");
				DBObject query = new BasicDBObject();
				query.put("_id", orderNo);

				DBObject obj= MongoProvider.findOne("zj",TB_USER_PAY, query);
				if(obj==null){
					response.addParameter("message", "订单号不存在!");
					response.setSucceed(false);
					return response;
				}
				Map<String,Object> params=new HashMap<String,Object>();
				String bank = (String)obj.get("bank");
                String company = (String)params.get("company");
				params.put("orderNo", orderNo);
				params.put("bank", obj.get("bank"));
				params.put("money", obj.get("money"));
				String html="";
				if("alipay".equals(bank)){
					html=aliPay(params,company);
				}else{
					html=aliBankPay(params,company);
				}
				response.addParameter("redirect", html);
				response.setSucceed(true);*/
            }else if(method.equalsIgnoreCase("PaymentReturn")){    //已废
				/*Map<String,Object> params=(Map<String,Object>)action.getParameterValue("params");
				String trade_status =(String)params.get("trade_status");
                String company = (String)params.get("company");
				Map<String,String> params2 = new HashMap<String,String>();
				for (Iterator iter = params.keySet().iterator(); iter.hasNext();) {
					String name = (String) iter.next();
					String valueStr = "";
					if(params.get(name) instanceof String[]){
						String[] values = (String[]) params.get(name);
						for (int i = 0; i < values.length; i++) {
							valueStr = (i == values.length - 1) ? valueStr + values[i]
									: valueStr + values[i] + ",";
						}
					}else{
						valueStr=(String)params.get(name);
					}
					//乱码解决，这段代码在出现乱码时使用。如果mysign和sign不相等也可以使用这段代码转化
//					valueStr = new String(valueStr.getBytes("ISO-8859-1"), "utf-8");
					params2.put(name, valueStr);
				}
				
				//计算得出通知验证结果
				boolean verify_result = AlipayNotify.verify(params2,company);
				if(verify_result){//验证成功
					//////////////////////////////////////////////////////////////////////////////////////////
					//请在这里加上商户的业务逻辑程序代码

					//——请根据您的业务逻辑来编写程序（以下代码仅作参考）——
					boolean synSuccess=false;
					if(trade_status.equals("TRADE_FINISHED") || trade_status.equals("TRADE_SUCCESS")){
						//判断该笔订单是否在商户网站中已经做过处理
							//如果没有做过处理，根据订单号（out_trade_no）在商户网站的订单系统中查到该笔订单的详细，并执行商户的业务程序
							//如果有做过处理，不执行商户的业务程序
						synSuccess=updateBankPay(params);
					}
					if(synSuccess){
						response.setMessage("验证成功");
						response.setSucceed(true);
					}else{
						response.setMessage("不存在的订单");
						response.setSucceed(false);
					}

					//——请根据您的业务逻辑来编写程序（以上代码仅作参考）——

					//////////////////////////////////////////////////////////////////////////////////////////
				}else{
					response.setMessage("验证失败");
					response.setSucceed(false);
				}*/

            }else if(method.equalsIgnoreCase("PaymentNotify")){
                Map<String,Object> params=map;
                String trade_status =(String)params.get("trade_status");
                String company = (String)params.get("extra_common_param");
                Map<String,String> params2 = new HashMap<String,String>();
                for (Iterator iter = params.keySet().iterator(); iter.hasNext();) {
                    String name = (String) iter.next();
                    String valueStr = "";
                    if(params.get(name) instanceof String[]){
                        String[] values = (String[]) params.get(name);
                        for (int i = 0; i < values.length; i++) {
                            valueStr = (i == values.length - 1) ? valueStr + values[i]
                                    : valueStr + values[i] + ",";
                        }
                    }else{
                        valueStr=(String)params.get(name);
                    }
                    //乱码解决，这段代码在出现乱码时使用。如果mysign和sign不相等也可以使用这段代码转化
//					valueStr = new String(valueStr.getBytes("ISO-8859-1"), "utf-8");
                    params2.put(name, valueStr);
                }

                //计算得出通知验证结果
                boolean verify_result = AlipayNotify.verify(params2,company);
//				boolean verify_result = true;//for test use
                log.info("PaymentNotify AlipayNotify check:"+verify_result+" company=="+company);
                boolean synSuccess=false;

                if(verify_result){//验证成功
                    //——请根据您的业务逻辑来编写程序（以下代码仅作参考）——
                    if(trade_status.equals("TRADE_FINISHED") || trade_status.equals("TRADE_SUCCESS")){
                        synSuccess=updateBankPay(params);
                    }
                    if(synSuccess){
                        response.setMessage("ali验证成功");
                        response.setSucceed(true);
                    }else{
                        response.setMessage("不存在的订单或订单已同步处理");
                        response.setSucceed(false);
                    }
                }else{
                    response.setMessage("ali验证失败");
                    response.setSucceed(false);
                }
            }else if(method.equalsIgnoreCase("BillPaymentNotify")){
                Map<String,Object> params=map;
                String trade_status =(String)params.get("trade_status");
                String company = (String)params.get("extra_common_param");
                Map<String,String> params2 = new HashMap<String,String>();
                for (Iterator iter = params.keySet().iterator(); iter.hasNext();) {
                    String name = (String) iter.next();
                    String valueStr = "";
                    if(params.get(name) instanceof String[]){
                        String[] values = (String[]) params.get(name);
                        for (int i = 0; i < values.length; i++) {
                            valueStr = (i == values.length - 1) ? valueStr + values[i]
                                    : valueStr + values[i] + ",";
                        }
                    }else{
                        valueStr=(String)params.get(name);
                    }
                    //乱码解决，这段代码在出现乱码时使用。如果mysign和sign不相等也可以使用这段代码转化
//					valueStr = new String(valueStr.getBytes("ISO-8859-1"), "utf-8");
                    params2.put(name, valueStr);
                }

                //计算得出通知验证结果
                boolean verify_result = AlipayNotify.verify(params2,company);
//                boolean verify_result = true;//for test use
                log.info("BillPaymentNotify AlipayNotify check:"+verify_result+" company=="+company);
                boolean synSuccess=false;

                if(verify_result){//验证成功
                    //——请根据您的业务逻辑来编写程序（以下代码仅作参考）——
                    if(trade_status.equals("TRADE_FINISHED") || trade_status.equals("TRADE_SUCCESS")){
                        synSuccess=updateBillBankPay(params);
                    }
                    if(synSuccess){
                        response.setMessage("ali验证成功");
                        response.setSucceed(true);
                    }else{
                        response.setMessage("不存在的订单或订单已同步处理");
                        response.setSucceed(false);
                    }
                }else{
                    response.setMessage("ali验证失败");
                    response.setSucceed(false);
                }
            }else if(method.equalsIgnoreCase("GetPayOrderNo")){
//				String accountId = action.getStringValue(Fields.Account);
                String orderNo=IDGenerator.getNext(6);
                response.addParameter("orderNo",orderNo);
                log.info("GetPayOrderNo:"+orderNo);
                response.setSucceed(true);
            }

        } catch (Exception e) {
            log.log(Level.WARNING, "pay Exception", e);
            response.setMessage(e.getMessage());
            response.setSucceed(false);
        }
        return response;
    }
    public static void syncServiceNo(Map<String,Object> params){

    }

    /**
     * status:pay-支付完成，nopay-等待支付，close-超时关闭
     * payType:
     *       balance:'余额充值',
     online:'网银充值',
     mix:混合充值
     flag:
     buySn:购买服务号
     snRenew:服务号续费，
     buyConcurrent:购买并发数，
     buyDialMin:购买外呼话费，
     buy400Min:购买400话费，
     pay:账户充值,
     buyLicence:购买licence,
     renewLicence:续费licene
     * @param map
     * @param accountId
     */
    private static void insertBankPay(Map<String,Object> map,String accountId){
        String flag=(String)map.get("flag");
        String serviceFlag=(String)map.get("serviceFlag");
        String money=(String)map.get("money");
        DBObject data = new BasicDBObject();
        data.put("_id", map.get("orderNo"));
        data.put("status", "nopay");
        data.put("money", money);
        data.put("bank", map.get("bank"));
        data.put("account", accountId);
        data.put("create_time", DateUtil.getCurrentTime());
        data.put("pay_time", DateUtil.getCurrentTime());
        data.put("flag", flag);
        data.put("payType", map.get("payType"));
        data.put("totalFee", map.get("totalFee"));
        data.put("income",map.get("income"));
        data.put("proxy",map.get("proxy"));
        data.put("balance",map.get("balance"));
        data.put("product",map.get("product"));
        data.put("serviceFlag",map.get("serviceFlag"));
        if("buyLicence".equals(flag)||"renewLicence".equals(flag)||"adjustLicenceNum".equals(flag)) {
            String licencePrice = (String) map.get("licencePrice");
            String licenceType = (String) map.get("licenceType");
            String beginDate = (String) map.get("beginDate");
            String month = map.get("month")==null?"0":(String) map.get("month");
            String num = (String) map.get("num");//续费的数量
            String changeNum = map.get("changeNum")==null?"0":(String) map.get("changeNum");
            if (Integer.parseInt(month) < 1) {
                num = changeNum;
            }
//            String presentMonth = (String) map.get("presentMonth");
            DBObject sn = new BasicDBObject();
            sn.put("licenceType", licenceType);
            sn.put("licencePrice", licencePrice);
            sn.put("beginDate", beginDate);
            sn.put("month", month);
//            sn.put("presentMonth", presentMonth);
            sn.put("num", num);
            sn.put("changeNum", changeNum);
            sn.put("_id", map.get("_id"));
            sn.put("pbx", map.get("pbx"));
            data.put("sn", sn);
        }else{
            if("400".equals(serviceFlag)){
                if(flag.equals("buy400Min")){
                    DBObject sn = new BasicDBObject();
                    sn.put("serviceno", map.get("serviceno"));
                    sn.put("month", "");
                    data.put("sn", sn);
                }else{
                    String month=(String)map.get("month");
                    DBObject sn = new BasicDBObject();
                    sn.put("serviceno", map.get("serviceno"));
                    sn.put("month", month);
                    data.put("sn", sn);
                }
            }else{
                if(flag.equals("pay")){
//            data.put("sn", new BasicDBObject());
                }else if(flag.equals("buyDialMin")){

                }else{
                    String month=(String)map.get("month");
                    String concurrent=(String)map.get("concurrent");

                    DBObject sn = new BasicDBObject();
                    sn.put("serviceno", map.get("serviceno"));
                    sn.put("month", month);
                    sn.put("concurrent", concurrent);

                    data.put("sn", sn);
                }
            }
        }

        MongoProvider.insert("zj",TB_USER_PAY, data);
    }

    private static boolean updateBankPay(Map<String,Object> map){
        boolean success=false;
        String orderNo=(String)map.get("out_trade_no");
        DBObject query = new BasicDBObject();
        query.put("_id", orderNo);
        DBObject obj= MongoProvider.findOne("zj",TB_USER_PAY, query);
        if(obj!=null){
            Object payAli=obj.get("ali");
            if(payAli==null){
                DBObject data = new BasicDBObject();
                data.put("trade_no", map.get("trade_no"));//支付宝交易号
//				data.put("is_success", map.get("is_success"));
//				data.put("exterface", map.get("exterface"));
                data.put("trade_status", map.get("trade_status"));//交易状态
//				data.put("notify_id", map.get("notify_id"));
                data.put("notify_time", map.get("notify_time"));//通知时间（支付宝时间）
                data.put("total_fee", map.get("total_fee"));//交易金额
                data.put("bank_seq_no", map.get("bank_seq_no"));//网银流水号

                DBObject ali = new BasicDBObject();
                ali.put("ali",data);
                ali.put("status", "pay");

                String payTime=map.get("gmt_payment")==null?DateUtil.getCurrentTime():(String)map.get("gmt_payment");
                ali.put("pay_time", payTime);
                MongoProvider.update("zj",TB_USER_PAY, query, new BasicDBObject("$set", ali));
                success=true;
//				syncServiceNo(obj.toMap());
            }else{
                String trade_status =(String)map.get("trade_status");
                if("TRADE_FINISHED".equals(trade_status)){
                    DBObject data = new BasicDBObject();
                    data.put("ali.trade_status_2", map.get("trade_status"));
                    data.put("ali.notify_time_2", map.get("notify_time"));
                    MongoProvider.update("zj",TB_USER_PAY, query, new BasicDBObject("$set", data));
                    log.info(orderNo+" update status is TRADE_FINISHED!");
                }else{
                    log.info(orderNo+" already sync!");
                }
            }
            return success;
        }else{
            log.warning(orderNo+" is not exits!");
            return success;
        }
    }
    private static void insertBillBankPay(Map<String,Object> map){
        String flag=(String)map.get("flag");
        String money=(String)map.get("money");
        DBObject data = new BasicDBObject();
        data.put("_id", map.get("orderNo"));
        data.put("status", "nopay");
        data.put("money", money);
        data.put("bank", map.get("bank"));
        data.put("proxy", map.get("proxy"));
        data.put("create_time", DateUtil.getCurrentTime());
        data.put("pay_time", DateUtil.getCurrentTime());
        data.put("flag", flag);
        data.put("payType", map.get("payType"));

        MongoProvider.insert(TB_Bill_USER_BANK_PAY, data);
    }
    private static boolean updateBillBankPay(Map<String,Object> map){
        boolean success=false;
        String orderNo=(String)map.get("out_trade_no");
        DBObject query = new BasicDBObject();
        query.put("_id", orderNo);
        DBObject obj= MongoProvider.findOne(TB_Bill_USER_BANK_PAY, query);
        if(obj!=null){
            Object payAli=obj.get("ali");
            if(payAli==null){
                DBObject data = new BasicDBObject();
                data.put("trade_no", map.get("trade_no"));//支付宝交易号
//				data.put("is_success", map.get("is_success"));
//				data.put("exterface", map.get("exterface"));
                data.put("trade_status", map.get("trade_status"));//交易状态
//				data.put("notify_id", map.get("notify_id"));
                data.put("notify_time", map.get("notify_time"));//通知时间（支付宝时间）
                data.put("total_fee", map.get("total_fee"));//交易金额
                data.put("bank_seq_no", map.get("bank_seq_no"));//网银流水号

                DBObject ali = new BasicDBObject();
                ali.put("ali",data);
                ali.put("status", "pay");

                String payTime=map.get("gmt_payment")==null?DateUtil.getCurrentTime():(String)map.get("gmt_payment");
                ali.put("pay_time", payTime);
                MongoProvider.update(TB_Bill_USER_BANK_PAY, query, new BasicDBObject("$set", ali));
                success=true;
            }else{
                String trade_status =(String)map.get("trade_status");
                if("TRADE_FINISHED".equals(trade_status)){
                    DBObject data = new BasicDBObject();
                    data.put("ali.trade_status_2", map.get("trade_status"));
                    data.put("ali.notify_time_2", map.get("notify_time"));
                    MongoProvider.update(TB_Bill_USER_BANK_PAY, query, new BasicDBObject("$set", data));
                    log.info(orderNo+" update status is TRADE_FINISHED!");
                }else{
                    log.info(orderNo+" already sync!");
                }
                log.info(orderNo+" already sync!");
            }
            return success;
        }else{
            log.warning(orderNo+" is not exits!");
            return success;
        }
    }
    private static String aliPay(Map<String,Object> map,String company) {
        //支付类型
        String payment_type = "1";
        //必填，不能修改
        //服务器异步通知页面路径
        String notify_url = PAY_NOTIFY;
        //需http://格式的完整路径，不能加?id=123这类自定义参数

        //页面跳转同步通知页面路径
//		String return_url = "http://218.241.181.18:8081/meet/pay_return.html";
        String return_url = "";
        //需http://格式的完整路径，不能加?id=123这类自定义参数，不能写成http://localhost/

        //卖家支付宝帐户
//		String seller_email = "moor@7moor.com";
        //必填

        //商户订单号
        String out_trade_no = (String)map.get("orderNo");
        //商户网站订单系统中唯一订单号，必填

        //订单名称
        String subject = PAY_SUBJECT;
        //必填

        //付款金额
        String total_fee =(String)map.get("money");
        //必填

        //订单描述
        String body = "";

        //商品展示地址
        String show_url = "";
        //需以http://开头的完整路径，例如：http://www.xxx.com/myorder.html

        //防钓鱼时间戳
        String anti_phishing_key = "";
        //若要使用请调用类文件submit中的query_timestamp函数

        //客户端的IP地址
        String exter_invoke_ip = "";
        //非局域网的外网IP地址，如：221.0.0.1

        //////////////////////////////////////////////////////////////////////////////////

        //把请求参数打包成数组
        Map<String, String> sParaTemp = new HashMap<String, String>();
        sParaTemp.put("service", "create_direct_pay_by_user");
        sParaTemp.put("partner", AlipayConfig.getPartner(company));
        sParaTemp.put("_input_charset", AlipayConfig.input_charset);
        sParaTemp.put("payment_type", payment_type);
        sParaTemp.put("notify_url", notify_url);
        sParaTemp.put("return_url", return_url);
        sParaTemp.put("seller_email", AlipayConfig.getSellerEmail(company));
        sParaTemp.put("out_trade_no", out_trade_no);
        sParaTemp.put("subject", subject);
        sParaTemp.put("total_fee", total_fee);
        sParaTemp.put("body", body);
        sParaTemp.put("show_url", show_url);
        sParaTemp.put("anti_phishing_key", anti_phishing_key);
        sParaTemp.put("exter_invoke_ip", exter_invoke_ip);
        sParaTemp.put("extra_common_param", company);


        //建立请求
        String sHtmlText = AlipaySubmit.buildRequestCustom(sParaTemp, "get", "确认",company);

        return sHtmlText;
    }
    private static String aliBankPay(Map<String,Object> map,String company) {
        //支付类型
        String payment_type = "1";
        //必填，不能修改
        //服务器异步通知页面路径
        String notify_url =PAY_NOTIFY;
        //需http://格式的完整路径，不能加?id=123这类自定义参数

        //页面跳转同步通知页面路径
        String return_url = "";
        //需http://格式的完整路径，不能加?id=123这类自定义参数，不能写成http://localhost/

        //卖家支付宝帐户
//		String seller_email = "moor@7moor.com";
        //必填

        //商户订单号
        String out_trade_no = (String)map.get("orderNo");
        //商户网站订单系统中唯一订单号，必填

        //订单名称
        String subject = PAY_SUBJECT;
        //必填

        //付款金额
        String total_fee =(String)map.get("money");
        //必填

        //订单描述
        String body = "";
        //默认支付方式
        String paymethod = "bankPay";
        //必填
        //默认网银
        String defaultbank = (String)map.get("bank");
        //必填，银行简码请参考接口技术文档

        //商品展示地址
        String show_url = "";
        //需以http://开头的完整路径，例如：http://www.xxx.com/myorder.html

        //防钓鱼时间戳
        String anti_phishing_key = "";
        //若要使用请调用类文件submit中的query_timestamp函数

        //客户端的IP地址
        String exter_invoke_ip = "";
        //非局域网的外网IP地址，如：221.0.0.1

        //商户买家签约名
//		String sign_name_ext="北京合力亿捷科技股份有限公司";
        //公用回传参数
        String extra_common_param="";

        //////////////////////////////////////////////////////////////////////////////////

        //把请求参数打包成数组
        Map<String, String> sParaTemp = new HashMap<String, String>();
        sParaTemp.put("service", "create_direct_pay_by_user");
        sParaTemp.put("partner", AlipayConfig.getPartner(company));
        sParaTemp.put("_input_charset", AlipayConfig.input_charset);
        sParaTemp.put("payment_type", payment_type);
        sParaTemp.put("notify_url", notify_url);
        sParaTemp.put("return_url", return_url);
        sParaTemp.put("seller_email", AlipayConfig.getSellerEmail(company));
        sParaTemp.put("out_trade_no", out_trade_no);
        sParaTemp.put("subject", subject);
        sParaTemp.put("total_fee", total_fee);
        sParaTemp.put("body", body);
        sParaTemp.put("paymethod", paymethod);
        sParaTemp.put("defaultbank", defaultbank);
        sParaTemp.put("show_url", show_url);
        sParaTemp.put("anti_phishing_key", anti_phishing_key);
        sParaTemp.put("exter_invoke_ip", exter_invoke_ip);
        sParaTemp.put("extra_common_param", company);    //公用回传参数
        //建立请求
        String sHtmlText = AlipaySubmit.buildRequestCustom(sParaTemp, "get", "确认",company);
        return sHtmlText;
    }
    /**
     * 超24小时则关闭
     */
    public static void closePayTimer(){
        if (payTimer != null) {
            payTimer.cancel();
            payTimer = null;
        }
        payTimer = new Timer();
        payTimer.schedule(new TimerTask() {
            @Override
            public void run() {
                try {
                    log.log(Level.INFO,"开始检查是否要关闭超时的支付订单");
                    DBObject query=new BasicDBObject();
                    query.put("status", "nopay");
                    List<DBObject> list= MongoProvider.find("zj",PaymentHandler.TB_USER_PAY, query);
                    if(list!=null && list.size()>0){
                        List<String> ids=new ArrayList<String>();
                        for (DBObject obj : list) {
                            String start=(String)obj.get("create_time");
                            Date date=DateUtil.parse(start);
                            if ((System.currentTimeMillis() - date.getTime()) > 24*60*60*1000){
                                String id=(String)obj.get("_id");
                                ids.add(id);
                            }
                        }
                        if(ids.size()>0){
                            DBObject condition=new BasicDBObject();
                            condition.put("_id", new BasicDBObject("$in",ids));
                            DBObject doc=new BasicDBObject();
                            doc.put("$set", new BasicDBObject("status","close"));
                            MongoProvider.batchUpdate("zj",PaymentHandler.TB_USER_PAY, condition, doc);
                        }
                    }
                } catch (Exception e) {
                    log.log(Level.WARNING, e.getMessage(), e);
                }
            }
        }, new Date(), 1000*60*60);
    }

    private static String getAccountCompany(String accountId){
        String company="";
        DBObject query=new BasicDBObject("_id",accountId);
        DBObject accDb=MongoProvider.findOne("platform_account",query);
        if(accDb!=null){
            String time=(String)accDb.get("createTime");
            String bankFlag=(String)accDb.get("bankFlag");
            if(Utils.getDateInterval(endAccTime,time)>0 || "1".equals(bankFlag) ){
                company=AlipayConfig.companyFlag_rl;
            }
        }
        return company;
    }
    private static String getProxyCompany(String proxyId){
        String company="";
        DBObject query=new BasicDBObject("_id",proxyId);
        DBObject proxyDb=MongoProvider.findOne("bill_system_user",query);
        if(proxyDb!=null){
            String time=(String)proxyDb.get("createTime");
            String bankFlag=(String)proxyDb.get("bankFlag");
            if(Utils.getDateInterval(endAccTime,time)>0 || "1".equals(bankFlag) ){
                company=AlipayConfig.companyFlag_rl;
            }
        }
        return company;
    }
}
