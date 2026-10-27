package com.dishui.util.report;

import com.mongodb.DBObject;

import java.util.List;

public interface ReportAnalyseData{

    /**
     * 获取账户分组字段
     * @param accountId
     * @return
     */
    public List<String> getAccountGroupFields(String accountId);

    /**
     * 没有流程  不用实现
     * @param accountId
     * @param flowId
     * @return
     */
    public List<String> getAccountGroupFields(String accountId, String flowId);

    /**
     * 获取要处理的账户列表
     * @return
     */
    public List<DBObject> getAccountList();

    /**
     * 处理分组结果
     * @param result
     * @return
     */
    public DBObject processResult(DBObject result);

    /**
     * 获取查询表名
     * @param accountId
     * @return
     */
    public String getQueryTable(String accountId);

    /**
     * 获取报表数据表名
     * @param accountId
     * @return
     */
    public String getInsertTable(String accountId);

    /**
     * 获取数据查询条件
     * @param accountId
     * @return
     */
    public DBObject getGroupCondition(String accountId);

    /**
     * 没有流程  不用实现
     * @param accountId
     * @param flowId
     * @return
     */
    public DBObject getGroupCondition(String accountId, String flowId);

    /**
     * 获取分组  init 对象
     * @param accountId
     * @return
     */
    public DBObject getGroupInit(String accountId);

    /**
     * 获取分组reduce
     * @param accountId
     * @return
     */
    public String getGroupReduce(String accountId);

    /**
     * 是否分流程进行统计
     * 没有流程 返回  null 即可
     * @param accountId
     * @return
     */
    public List<DBObject> getBusinessFlow(String accountId);

    /**
     * 获取数据的删除 条件
     */
    public DBObject getRemoveCondition(String accountId);

}
