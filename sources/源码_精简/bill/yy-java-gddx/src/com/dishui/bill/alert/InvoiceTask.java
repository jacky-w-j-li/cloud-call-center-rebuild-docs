package com.dishui.bill.alert;

import com.dishui.bill.service.Utils;
import com.dishui.db.mango.MongoProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.Calendar;
import java.util.List;
import java.util.TimerTask;
import java.util.logging.Level;
import java.util.logging.Logger;

public class InvoiceTask extends TimerTask {
    private static Logger log = Logger.getLogger(InvoiceTask.class.getName());

    @Override
    public void run() {
        try {
            Calendar now = Calendar.getInstance();
            log.info("InvoiceTask hour::=============" + now.get(Calendar.HOUR_OF_DAY));
            if (now.get(Calendar.HOUR_OF_DAY) != 0) {
                return;
            }
            dealOverDueInvoice();

        } catch (Exception e) {
            log.log(Level.WARNING, "process InvoiceTask exception! ", e);
            e.printStackTrace();
        }
    }



    /**
     * 超过3个月未开发票的充值记录更新为过期
     */
    private void dealOverDueInvoice() {
        String now = Utils.getDefaultCurrentDate();
        DBObject condition = new BasicDBObject().append("invoiceStatus", null);
        List<DBObject> list = MongoProvider.find("zj","user_bank_pay", condition);
        for (int i = 0; i < list.size(); i++) {
            try {
                DBObject current = list.get(i);
                String id = (String) current.get("_id");
                String payTime = (String) current.get("pay_time");
                int days = Utils.getBetweenDays(now, payTime);
                if(days < 0 && Math.abs(days) > 90){    //3个月过期
                    DBObject set = new BasicDBObject();
                    set.put("invoiceStatus", "overdue");
                    MongoProvider.update("zj","user_bank_pay", new BasicDBObject("_id", id), new BasicDBObject("$set", set));
                }
            } catch (Exception e) {
                log.log(Level.WARNING, "process dealOverDueInvoice exception! ", e);
                e.printStackTrace();
            }
        }
    }

}
