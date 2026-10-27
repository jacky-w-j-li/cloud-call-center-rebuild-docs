var util = {};
var _ = require('underscore');

/**
 * 生成阶段账单
 * @param bill
 * @returns {*}
 */

util.generateBillBackup = function (bill) {

    // 如果当前没有备份（即没有关联过财务账户）
    if (!bill.backup) {
        return [bill];
    }

    // 有备份
    if (Array.isArray(bill.backup)) {
        var tmpBill = _.clone(bill);
        delete tmpBill.backup;
        bill.backup.push(tmpBill);
        return bill.backup;
    }

    // 有backup但不是对象
    return  [bill];
};

/**
 * 整理账单查询返回数据
 * @param bills
 */
util.transferBillData = function (bills, financeAccount) {
    if (!financeAccount) {
        return bills;
    }

    var retBill = [];

    bills.forEach(function (bill) {
        // 没有财务账户，直接返回
        if (!bill.financeAccount) {
            retBill.push(bill);
        }

        // 当前账单关联当前财务账户
        if (bill.financeAccount == financeAccount) {
            util.generateBillBackup(bill);
        }

        // 备份中有关联当前财务账户的账单
        if (bill.backup && Array.isArray(bill.backup)) {
            bill.backup.forEach(function (backupBill, i) {
                if (backupBill && backupBill.financeAccount == financeAccount) {
                    retBill.push(util.generateStageBill(backupBill, bill.backup[i-1]));
                }
            });
        }

    });

    return retBill;
};

/**
 * 计算阶段性账单
 * @param currentBill
 * @param oldBill
 */
util.generateStageBill = function (currentBill, oldBill) {
    if (!currentBill || !oldBill) {
        return currentBill;
    }

    var billCurrent = _.clone(currentBill);
    var billOld = _.clone(oldBill);

    // todo 这里记录账单需要备份的字段，如果账单有更改，这里一定要调整
    var calculateKey = [
        /* bill_call_consume */ 'calls', 'localMinutes', 'remoteMinutes', 'localSecond6', 'remoteSecond6', 'minConsume', 'giveMinute', 'presentMinute', 'actualConsume', 'monthRent',
        /* bill_sms_consume */ 'num',
    ];

    // 计算阶段性账单备份
    calculateKey.forEach(function (key) {
        if (billCurrent[key] && billOld[key]) {
            billCurrent[key] = billCurrent[key] - billOld[key];
        }
    });

    return billCurrent;
};

module.exports = util;