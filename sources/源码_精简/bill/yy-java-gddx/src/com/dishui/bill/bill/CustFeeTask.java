package com.dishui.bill.bill;

import com.dishui.bill.alert.AlertService;
import com.dishui.bill.common.Constants;
import com.dishui.bill.db.model.Account;
import com.dishui.bill.db.model.CustFee;
import com.dishui.bill.db.model.SystemUser;
import com.dishui.bill.db.service.AccountService;
import com.dishui.bill.db.service.CustFeeService;
import com.dishui.bill.db.service.SystemUserService;
import com.dishui.util.DateUtil;

import java.util.*;
import java.util.logging.Logger;

/**
 * Created by jackwong on 16/3/8.
 */
public class CustFeeTask extends TimerTask {
    private static Logger logger = Logger.getLogger(CustFeeTask.class.getName());

    private static int  MANUAL_CUSTFEE_WARNING_DAY_2_END = 2; //手动续费到期预警天数 2天
    private static Map<String,Date> manualCustFeeNotifyCustFeeMap = new HashMap<String,Date>();//手动续费到期预警记录,避免重发邮件.只要保证 MANUAL_CUSTFEE_WARNING_DAY_2_END 天内不重启系统.

    @Override
    public void run(){
        //logger.info("custFeeTask " +Thread.currentThread().getName() +":"+System.currentTimeMillis());
        //所有开通了自定义扣费的账户
        List<String> AccountIdsOpenedCustFee = CustFeeService.getAllAccountIdsOpenedCustFee();
        if(AccountIdsOpenedCustFee == null || AccountIdsOpenedCustFee.size() <= 0){
            return;
        }

        for(String accountId : AccountIdsOpenedCustFee){
            List<CustFee> custFees = CustFeeService.getAutoRenewInUseCustFeeList(accountId);
            if(custFees == null || custFees.size() <= 0 ){
                continue;
            }
            for(CustFee custFee : custFees) {
                //若是正在使用中的自动续费,执行扣费
                if (custFee.isAutoRenew() && custFee.getState().equals(Constants.CUSTFEE_STATE_NORMAL)) {
                    deductAutoRenewCustFee(custFee,accountId);
                }else
                //正在使用中的手动续费,更新状态
                if(!custFee.isAutoRenew() && custFee.getState().equals(Constants.CUSTFEE_STATE_NORMAL)){
                    refreshManualCustFeeState(custFee,accountId);
                }

            }
        }


        //去掉过期预警记录
        Iterator<Map.Entry<String,Date>> itr = manualCustFeeNotifyCustFeeMap.entrySet().iterator();
        while(itr.hasNext()){
            Map.Entry<String,Date> custFeeNotify = itr.next();

            Calendar now = Calendar.getInstance();
            if(now.after(custFeeNotify.getValue())){
                itr.remove();
            }
        }

    }

    /**
     * 刷新手动续费状态
     */
    private void refreshManualCustFeeState(CustFee custFee,String accountId){
        if(custFee == null || custFee.isAutoRenew() ||  !custFee.getState().equals(Constants.CUSTFEE_STATE_NORMAL) || accountId == null){
            return;
        }

        Date currentTime = new Date();


        //到期停用
        if(custFee.getEndTime().before(currentTime)){
            CustFeeService.updateState(accountId,custFee.getId(),Constants.CUSTFEE_STATE_STOP);

            AlertService.custFeeStopNotify(accountId,custFee.getId(),currentTime,false);//邮件通知
            return;
        }

        //还有2天到期啦,赶紧来续费
        String custFeeIdWarningKey = accountId + "_" + custFee.getId();
        long day2End = DateUtil.getDifferenceDays(custFee.getEndTime(),currentTime);
        if(0 <= day2End && day2End <= MANUAL_CUSTFEE_WARNING_DAY_2_END && !manualCustFeeNotifyCustFeeMap.containsKey(custFeeIdWarningKey)){
            AlertService.custFeeAlert(accountId,custFee.getId(),day2End);//邮件提醒
            manualCustFeeNotifyCustFeeMap.put(custFeeIdWarningKey,custFee.getEndTime());
        }
    }

    /**
     * 自动扣费.
     *
     * @param custFee
     * @param accountId
     */
    private void deductAutoRenewCustFee(CustFee custFee,String accountId){
        if(custFee == null || !custFee.isAutoRenew() || !custFee.getState().equals(Constants.CUSTFEE_STATE_NORMAL) || accountId==null){
            return;
        }

        Date currentTime = new Date();
        String pricePeriod = custFee.getPricePeriod();
        Date oldAutoRenewEndTime = custFee.getAutoRenewEndTime() == null ? custFee.getBeginTime() : custFee.getAutoRenewEndTime();

        Object[]  latestDeductFeeTimeAndPeriodCount = getNextAutoRenewEndTimeAndPeriodCount(oldAutoRenewEndTime,pricePeriod,currentTime);
        if(latestDeductFeeTimeAndPeriodCount == null){
            logger.warning("deduct auto renew custFee failed.cause by failure of calculate next deducting time.[accountId:"+accountId+"]");
            return;
        }

        Date newAutoRenewEndTime = (Date)latestDeductFeeTimeAndPeriodCount[0];
        Integer periodCount = (Integer)latestDeductFeeTimeAndPeriodCount[1];
        if(periodCount == 0){
            return;
        }

        long deductFee = periodCount * custFee.getPrice();//消费金额计算
        long proxyIncome = deductFee * (100 - CustFeeService.getCustFeePoundage(accountId))/100;//代理提成计算


        Account account = AccountService.get(accountId);//查看余额是否足够
        // if(account.getBalance() + account.getOverdraw() < deductFee){
        if (!AccountService.hasEnoughBalance(accountId, deductFee)) {
            //余额不足,停用
            CustFeeService.updateState(accountId,custFee.getId(),Constants.CUSTFEE_STATE_STOP);

            AlertService.custFeeStopNotify(accountId,custFee.getId(),currentTime,true);//邮件通知
            return;
        }

        SystemUser proxy = AccountService.getProxy(accountId);
        String proxyId = proxy == null ? null : proxy.getId();


        // AccountService.incrBalance2Account(accountId, -deductFee);//扣余额
        AccountService.ConsumeFinanceAccountBalanceRes consumeRes = AccountService.consumeFinanceAccountBalance(accountId, -deductFee);
        String userPayId = AccountService.saveConsumeRecordAndReturnId(accountId,deductFee,proxyIncome,account.getBalance() - deductFee,proxyId,Constants.PAY_TYPE_BALANCE,Constants.PAY_FLAG_DEDUCT_CUSTFEE,Constants.PRODUCT_CUSTFEE);//客户消费记录
        if (consumeRes.hasConsumeFinanceAccount) {
            AccountService.bindFinanceAccountToUserPay(userPayId, consumeRes.paidAccount.get("_id").toString());
        }

        if(proxy != null && proxy.getProxyType().equals(Constants.PROXY_TYPE_CHANNEL)) {
            SystemUserService.incrProxyBalance(proxyId,proxyIncome);//代理提成加到代理余额
            SystemUserService.saveProxyIncomeRecord(accountId,proxyId,proxyIncome,proxy.getBalance() + proxyIncome,Constants.PAY_FLAG_DEDUCT_CUSTFEE,Constants.PROXY_SOURCE_CUSTFEE);//代理收支明细
        }

        CustFeeService.updateAutoRenewEndTime(account.getId(),custFee.getId(),newAutoRenewEndTime);
    }

    /**
     * 根据老的到期时间计算出新的费用到期时间,并计算距离上次到期时间的使用周期数
     *
     * @param oldAutoRenewEndTime
     * @param pricePeriod
     * @param currentTime
     * @return
     */
    private Object[] getNextAutoRenewEndTimeAndPeriodCount(Date oldAutoRenewEndTime, String pricePeriod,Date currentTime){
        if(oldAutoRenewEndTime == null || pricePeriod == null){
            return null;
        }

        Calendar calendar = Calendar.getInstance();
        calendar.setTime(new Date(oldAutoRenewEndTime.getTime()));

        //如果上次交的费用还没有到期
        if(oldAutoRenewEndTime.after(currentTime)){
            return new Object[]{oldAutoRenewEndTime,0};
        }

        int calendarUnit;
        if(pricePeriod.equalsIgnoreCase(Constants.CUSTFEE_PRICE_PERIOD_YEAR)){
            calendarUnit = Calendar.YEAR;
        }else if(pricePeriod.equalsIgnoreCase(Constants.CUSTFEE_PRICE_PERIOD_MONTH)){
            calendarUnit = Calendar.MONTH;
        }else if(pricePeriod.equalsIgnoreCase(Constants.CUSTFEE_PRICE_PERIOD_WEEK)){
            calendarUnit = Calendar.WEEK_OF_YEAR;
        }else if(pricePeriod.equalsIgnoreCase(Constants.CUSTFEE_PRICE_PERIOD_DAY)){
            calendarUnit = Calendar.DATE;
        }else if(pricePeriod.equalsIgnoreCase(Constants.CUSTFEE_PRICE_PERIOD_HOUR)){
            calendarUnit = Calendar.HOUR;
        }else{
            logger.warning("pricePeriod not defined");
            return null;
        }

        Integer periodCount = 0;
        while(calendar.getTime().before(currentTime)){
            calendar.add(calendarUnit,1);
            periodCount++;
        }

        return new Object[]{calendar.getTime(),periodCount};
    }

}
