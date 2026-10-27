<%@ page contentType="text/html; charset=UTF-8" %>

<%@ taglib prefix="s" uri="/struts-tags" %>

<%@ taglib prefix="h" uri="/WEB-INF/hollyc5-tags.tld" %>

<%@ page import="com.hollycrm.framework.util.HtmlUtil" %>
<div type="dojo/method" event="onLoaded" args="param, connectors">
    dojo.require("icallcenter.Monitor");
    if(phone){
		monitor = new icallcenter.Monitor(phone);
	}
</div>
<div type="dojo/method" event="onShowed">
</div>

<div class="task_title"></div>
<div class="task_content">
    <div class='form_area'> 
        <div class="form_head"> 
            <div class='form_title'>
                <span class='form_caption'>监控</span>
            </div>

        </div>
		<div style="width:100%;padding-bottom:15px;">
        <DIV class="grid" style="width:60%;float:left;">
            <DIV class="gridhead">				 
            <TABLE width="100%" height="100%" cellSpacing=0 cellPadding=0>
                <COLGROUP>					
					<COL width="10%" span="4">
                </COLGROUP>
				  <THEAD class="monitor_thead">
					<tr >
					  <th colspan='4' align="left"><div class="monitor_thead_title">通话监控列表</div></th>
					</tr>
				  </THEAD>
                <TBODY>
                    <TR>  
                            <td align="center">服务号码</td>
                            <td align="center">今日外部来电数</td>
                            <td align="center">今日未接外部来电</td>
                            <td align="center">今日已接外部来电</td>
                           <!-- <td align="center">外呼电话数</td>
                            <td align="center">外呼接通数</td> --> 
                    </TR>
                </TBODY>
             </TABLE>
            </DIV>
            <DIV class="griddata" >       
             	<DIV  style="height:0px">
                    <TABLE id="icc.monitor.serviceNos" width="100%" cellSpacing=0 cellPadding=1>
                             <COLGROUP >
									<COL width="10%" span="4">
                             </COLGROUP>
                             <TBODY>

                             </TBODY>
                        </TABLE>
                 </DIV>                  
            </DIV>
        </DIV> 		
		
        <DIV class="grid" style="width:60%;float:left;">
            <DIV class="gridhead">				 
            <TABLE width="100%" height="100%" cellSpacing=0 cellPadding=0>
                <COLGROUP>					
					<COL width="10%" span="5">
                </COLGROUP>
				  <THEAD class="monitor_thead">
					<tr >
					  <th colspan='5' align="left"><div class="monitor_thead_title">技能组监控列表</div></th>
					</tr>
				  </THEAD>
                <TBODY>
                    <TR id="icc.monitor.queues.thead">  
                            <td align="center">队列名称</td>
                            <td align="center">空闲座席数</td>
                            <td align="center">签入座席数</td>
                            <td align="center">队列等待数</td>
                            <td align="center">今日接通电话数</td>
                            <!-- <td align="center">未接电话数</td> -->
                    </TR>
                </TBODY>
             </TABLE>
            </DIV>
            <DIV class="griddata" >       
             	<DIV  style="height:0px">
                    <TABLE id="icc.monitor.queues" width="100%" cellSpacing=0 cellPadding=1>
                             <COLGROUP >
									<COL width="10%" span="5">
                             </COLGROUP>
                             <TBODY>
                                    <s:iterator value="queues">
                             		<tr class=even queueId='<s:property value="queueNo" />'>
                             				<td><nobr><s:property value="queueName" /></nobr></td>
                             				<td></td>
                             				<td></td>
                             				<td></td>                       				
                             				<td></td>                       				
                             		</tr>
                                    </s:iterator>
                             </TBODY>
                        </TABLE>
                 </DIV>                  
            </DIV>
        </DIV> 

        
        <DIV class="grid" style="width:80%;float:left;">
            <DIV class="gridhead">				 
            <TABLE width="100%" height="100%" cellSpacing=0 cellPadding=0>
                <COLGROUP>					
       						<col span=6 width="10%" />
        					<col width="18%" />
                </COLGROUP>
				  <THEAD>
				  <THEAD class="monitor_thead">
					<tr>
					  <th colspan='7' align="left"><div class="monitor_thead_title">座席监控列表</div></th>
					</tr>
				  </THEAD>
                <TBODY>
                    <TR>  
                            <td align="center">座席姓名</td>
                            <td align="center">工号</td>
							<td align="center">已接数</td>
							<td align="center">外呼数</td>
                            <td align="center">客户号码</td>
<!--                            <td align="center">在线时长</td>
                            <td align="center">置忙时长</td>
                            <td align="center">签出时长</td>-->
                            <td align="center">接听方式</td>
                            <td align="center">状态</td>
                            <td align="center">状态时长</td>
							<td align="center">网络延迟</td>
                            <td align="center">操作</td>
                    </TR>
                </TBODY>
             </TABLE>
            </DIV>
            <DIV class="griddata" >       
             	<DIV  style="height:0px">
                    <TABLE id="icc.monitor.agents" width="100%" cellSpacing=0 cellPadding=1>
                             <COLGROUP >
								<col span=6 width="10%" />
								<col width="18%" />
                             </COLGROUP>
                             <TBODY>
                                    <s:iterator value="agents">
                             		<tr class=even userId="<s:property value="userId" />" agetId='<s:property value="extension" />'>
                             				<td><nobr><s:property value="name" /></nobr></td>
                             				<td></td>
                             				<td></td>
                             				<td></td>
                             				<td></td>
                             				<td></td>
                             				<td userId="<s:property value="userId" />" sipNo="<s:property value="extension" />" username="<s:property value="username" />"><a href="#">&nbsp;监听&nbsp;</a><a style="display:none" href="#">&nbsp;结束监听&nbsp;</a><a href="#">&nbsp;强拆&nbsp;</a><a href="#">&nbsp;抢接&nbsp;</a><a href="#">&nbsp;签出&nbsp;</a></td>
                             		</tr>
                                    </s:iterator>
                             </TBODY>
                        </TABLE>
                 </DIV>                  
            </DIV>
        </DIV>
       
        <div>        
    </div>     
</div>
