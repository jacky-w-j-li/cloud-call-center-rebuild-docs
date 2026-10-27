package com.dishui.bill.bill;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.logging.Logger;

import com.alipay.util.DoubleUtil;
import com.dishui.bill.alert.AlertTask;
import com.dishui.bill.alert.InvoiceTask;
import com.dishui.bill.alert.NotifyTask;

import com.dishui.bill.service.BillTimer;
import com.dishui.proxy.*;
import com.dishui.sms.ClearSmsTempDataTask;

public class BillMaster {
    private static Logger log = Logger.getLogger(BillMaster.class.getName());
    public static String DB_ACCOUNT = "platform_account";
    public static String DB_ACCOUNT_PRODUCT = "platform_account_product";
    public static String DB_ACCOUNT_BALANCE = "bill_balance";
    public static String DB_ACCOUNT_CALL = "call_sheet_bill";
    public static String DB_ACCOUNT_CALL_QUERY = "call_sheet_bill_query";
    public static String DB_ACCOUNT_BALANCE_SYS_LOG = "account_balance_sys_log";
    public static String DB_400 = "platform_num400";
    public static String DB_CALL_CONSUME = "bill_call_consume";
    public static String DB_CALL_INCOME = "bill_call_income";
    public static String DB_400_INCOME = "bill_400_income";
    public static String DB_CALL_PROXY_DETAIL = "bill_call_proxy_detail";
    public static String DB_400_PROXY_DETAIL = "bill_400_proxy_detail";
    public static String DB_400_PROXY_CALLEVENT = "bill_400_proxy_callevent";

    public static String DB_PLATFORM_LINE = "platform_line";
    public static String DB_CALL_LINE = "bill_call_line";
    public static String DB_CALL_LINE_DETAIL = "bill_call_line_detail";

    public static boolean accountBillStatus = false;
    public static boolean agentBillStatus = false;
    public static boolean callBillStatus = false;

    public static BillMaster instance;

    private AlertTask alertTask;
    private AccountBillTask accountBillTask;
    private ProxyTelFeeTask proxyTelFeeTask;
    private Proxy400TelFeeTask proxy400TelFeeTask;
    private ProxyMinConsumeTask proxyMinTask;
    private ProxySmsFeeTask proxySmsFeeTask;
    private ProxyVoiceVerifyCodeFeeTask proxyVoiceVerifyFeeTask;

    private NotifyTask notifyTask;
    private ClearSmsTempDataTask clearSmsTempDataTask;
    private InvoiceTask invoiceTask;



    private Thread callProcessor;
    private Thread notifyProcessor;
    private Thread smslBillThread;
    private Thread callEvent;
    private Thread callEventReSend;
    private Thread flowBillThread;
    private Thread VoiceVerifyBillThread;

    private CustFeeTask custFeeTask;


    public BillMaster() {
        instance = this;
        callProcessor = new CallBillThread();
        notifyProcessor = new NotifyThread();
        smslBillThread = new SmslBillThread();
        callEvent = new CallEventThread();
        callEventReSend = new CallEventReSendThread();

        alertTask = new AlertTask();
        accountBillTask = new AccountBillTask();
        proxyTelFeeTask = new ProxyTelFeeTask();
        proxy400TelFeeTask = new Proxy400TelFeeTask();
        proxyMinTask = new ProxyMinConsumeTask();
        proxySmsFeeTask = new ProxySmsFeeTask();
        proxyVoiceVerifyFeeTask = new ProxyVoiceVerifyCodeFeeTask();
        notifyTask = new NotifyTask();
        clearSmsTempDataTask = new ClearSmsTempDataTask();

        flowBillThread = new FlowBillThread();
        VoiceVerifyBillThread = new VoiceVerifyCodeBillThread();
        invoiceTask = new InvoiceTask();

        custFeeTask = new CustFeeTask();
    }

    public static BillMaster getInstance() {
        if (instance == null) {
            new BillMaster();
        }
        return instance;
    }

    public void start() {
        callProcessor.start();
        notifyProcessor.start();
        smslBillThread.start();
        flowBillThread.start();
        VoiceVerifyBillThread.start();
        callEvent.start();
        callEventReSend.start();
        Calendar now = Calendar.getInstance();
        now.set(Calendar.HOUR_OF_DAY, 0);
        now.set(Calendar.MINUTE, 0);
        now.set(Calendar.SECOND, 0);
        BillTimer.getInstance().scheduleAtFixedRate(alertTask, now.getTime(), 24 * 60 * 60 * 1000);
        BillTimer.getInstance().scheduleAtFixedRate(accountBillTask, now.getTime(), 24 * 60 * 60 * 1000);
        BillTimer.getInstance().scheduleAtFixedRate(invoiceTask, now.getTime(), 24 * 60 * 60 * 1000);
        BillTimer.getInstance().scheduleAtFixedRate(custFeeTask, now.getTime(),      60 * 60 * 1000);

        startProxyMinTask();
        startProxyFeeTask();
        startProxy400FeeTask();
        startNotifyTask();
        startProxySmsTask();
        startProxyVoiceVerifyTask();
        startClearSmsTempData();

    }

    private void startProxyFeeTask(){
        Calendar _now = Calendar.getInstance();
        int hour=_now.get(Calendar.HOUR_OF_DAY);
        if(hour>=0 && hour<=2) {
            _now.set(Calendar.HOUR_OF_DAY, 2);
            _now.set(Calendar.MINUTE, 0);
            _now.set(Calendar.SECOND, 0);
        }else{
            _now.add(Calendar.DAY_OF_MONTH, 1);
            _now.set(Calendar.HOUR_OF_DAY, 2);
            _now.set(Calendar.MINUTE, 0);
            _now.set(Calendar.SECOND, 0);
        }
        BillTimer.getInstance().scheduleAtFixedRate(proxyTelFeeTask, _now.getTime(), 24 * 60 * 60 * 1000);
    }

    private void startProxy400FeeTask(){
        Calendar _now = Calendar.getInstance();
        int hour=_now.get(Calendar.HOUR_OF_DAY);
        if(hour>=0 && hour<=2) {
            _now.set(Calendar.HOUR_OF_DAY, 2);
            _now.set(Calendar.MINUTE, 0);
            _now.set(Calendar.SECOND, 0);
        }else{
            _now.add(Calendar.DAY_OF_MONTH, 1);
            _now.set(Calendar.HOUR_OF_DAY, 2);
            _now.set(Calendar.MINUTE, 0);
            _now.set(Calendar.SECOND, 0);
        }
        BillTimer.getInstance().scheduleAtFixedRate(proxy400TelFeeTask, _now.getTime(), 24 * 60 * 60 * 1000);
    }
    private void startProxyMinTask(){
        Calendar now = Calendar.getInstance();
        now.set(Calendar.HOUR_OF_DAY, 0);
        now.set(Calendar.MINUTE, 5);
        now.set(Calendar.SECOND, 0);
        BillTimer.getInstance().scheduleAtFixedRate(proxyMinTask, now.getTime(), 24 * 60 * 60 * 1000);
    }
    private void startClearSmsTempData(){
        BillTimer.getInstance().scheduleAtFixedRate(clearSmsTempDataTask, new Date(), 3600000);
    }
    private void startProxySmsTask(){
        Calendar _now = Calendar.getInstance();
        int hour=_now.get(Calendar.HOUR_OF_DAY);
        if(hour>=0 && hour<=2) {
            _now.set(Calendar.HOUR_OF_DAY, 2);
            _now.set(Calendar.MINUTE, 0);
            _now.set(Calendar.SECOND, 0);
        }else{
            _now.add(Calendar.DAY_OF_MONTH, 1);
            _now.set(Calendar.HOUR_OF_DAY, 2);
            _now.set(Calendar.MINUTE, 0);
            _now.set(Calendar.SECOND, 0);
        }
        BillTimer.getInstance().scheduleAtFixedRate(proxySmsFeeTask, _now.getTime(), 24 * 60 * 60 * 1000);
    }
    private void startProxyVoiceVerifyTask(){
        Calendar _now = Calendar.getInstance();
        int hour=_now.get(Calendar.HOUR_OF_DAY);
        if(hour>=0 && hour<=2) {
            _now.set(Calendar.HOUR_OF_DAY, 2);
            _now.set(Calendar.MINUTE, 0);
            _now.set(Calendar.SECOND, 0);
        }else{
            _now.add(Calendar.DAY_OF_MONTH, 1);
            _now.set(Calendar.HOUR_OF_DAY, 2);
            _now.set(Calendar.MINUTE, 0);
            _now.set(Calendar.SECOND, 0);
        }
        BillTimer.getInstance().scheduleAtFixedRate(proxyVoiceVerifyFeeTask, _now.getTime(), 24 * 60 * 60 * 1000);
    }
    private void startNotifyTask(){
        Calendar now = Calendar.getInstance();
        now.set(Calendar.HOUR_OF_DAY, 7);
        now.set(Calendar.MINUTE, 0);
        now.set(Calendar.SECOND, 0);
        BillTimer.getInstance().scheduleAtFixedRate(notifyTask, now.getTime(), 24 * 60 * 60 * 1000);
    }
    public static void main(String[] args) {
/*        SimpleDateFormat df=new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        try {
            Date date=df.parse("2014-10-22 01:30:00");
            Calendar now = Calendar.getInstance();
            now.setTime(date);
            System.out.println("time=========" + df.format(now.getTime()));
            System.out.println("time========="+now.get(Calendar.DAY_OF_MONTH));
        } catch (ParseException e) {
            e.printStackTrace();
        }*/
        List<String> useNumList=new ArrayList<String>();
        useNumList.add("111");
        useNumList.add("222");
        System.out.println(Arrays.toString(useNumList.toArray()));

        long a=1000000l;
        long b=2300l;
        System.out.println(a/b);

//        long fee = Long.valueOf(String.valueOf("100.01"));
        double fee1 =Double.valueOf(String.valueOf("100.01"));
//        fee1=DoubleUtil.round(fee1,2);
        long fee=new Double(fee1).longValue();
        System.out.println("fee======"+fee);
    }
}
