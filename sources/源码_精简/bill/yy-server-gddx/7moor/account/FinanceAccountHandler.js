/**
 * Created by kivi on 2016/10/28.
 */
var mongo = require('appDb/MongoDb');
var logger = require('appLog');
var Then = require('thenjs');
var constants = require(__baseDir + "/7moor/utils/Constants");
var financeAccountDBProxy = require('./FinanceAccountDBProxy');

var handler = {
    /**
     * 扣钱策略（决定扣普通账户本身的钱，还是扣这个账户的财务账户的钱）
     * @param accountId 普通账户的id
     * @param set 扣掉的余额的数量
     * @param option 其他选项
     * @param callback 回调函数，接收参数的格式是(err, newAccount, hasFinanceAccount)
     * * err 错误信息
     * * newAccount 被扣了钱的账户的所有信息（扣完钱之后的信息，有可能是财务账户，也有可能是当前账户）
     * * hasFinanceAccount 是否是财务账户
     * * currentAccount 当前账户
     */
    consumeFinanceAccountBalance: function (accountId, set, option, callback) {
        Then()
            .then(function (cont) {
                // 确定到底扣谁的钱
                mongo.db().collection(constants.DB.platform_account).findOne({_id: accountId}, null, {populate: 'financeAccount'}, function (err, account) {
                    if (err) {
                        cont(err);
                    } else {
                        if (account.financeAccount) {
                            financeAccountDBProxy.queryFinanceAccountById(account.financeAccount, function (err, finnaceAccount) {
                                if (err) {
                                    cont(err)
                                } else {
                                    // // 如果财务账户钱不够用了，但是个人账户钱够支付，那么认为本次支付无财务账户，走本人账户支付路线
                                    // if (finnaceAccount.balance + set.balance < 0) {
                                    //     cont(err, account, null);
                                    // } else {
                                    //     cont(err, account, finnaceAccount);
                                    // }

                                    // 只要关联了财务账户，就一定扣财务账户的钱
                                    cont(err, account, finnaceAccount);
                                }
                            });
                        } else {
                            cont(null, account, null);
                        }
                    }
                });
            })
            .then(function (cont, account, financeAccount) {
                var hasFinanceAccount = financeAccount ? true : false;
                var id = hasFinanceAccount ? financeAccount._id : account._id;
                // 扣钱并返回扣完钱后的账户信息
                // 如果是扣消费者本人的钱，那么返回后的逻辑和原来一样
                // 如果是扣财务账号的钱，那么返回后的逻辑走的是财务账号

                /* 当财务账户余额不足时，扣个人账户的钱，个人账户的余额也不足的时候，返回错误（理论上这两种情况不应该同时出现）
                 * 解决方法，因为无法避免并发支付的时候导致的余额为负的情况，所以这里扣余额的方法不做限制，允许扣为负值，后期让用户补充即可
                 */

                mongo.db().collection(constants.DB.platform_account).findAndModify({_id: id}, [], {$inc: set}, {new: true}, function (err, newAccount) {
                    if (err) {
                        cont(err);
                    } else {
                        if (hasFinanceAccount) {
                            callback(null, account, newAccount, hasFinanceAccount);
                        } else {
                            callback(null, newAccount, newAccount, hasFinanceAccount);
                        }
                        cont();
                    }
                });
            })
            .fail(function (cont, err) {
                if (err) {
                    callback(err);
                }
            });
    },
    constant: 'financeAccount'
};

module.exports = handler;