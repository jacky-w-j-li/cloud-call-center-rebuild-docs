package com.m7.cc.ass.model.configuration;

import java.util.HashMap;
import java.util.Vector;

import com.m7.cc.util.Utils;

public class RouteRule {
	private static final int DEFAULT_PRIORITY = 0;
	public static final String CONJUNCTION_AND = "and";
	public static final String CONJUNCTION_OR = "or";

	private Vector<RouteRuleCondition> conditions = null;
	private HashMap<String, String> conjunctions = null;
	private String toPeerMatched;
	private int priority; // the more , the less

	public RouteRule() {
		conditions = new Vector<RouteRuleCondition>();
		conjunctions = new HashMap<String, String>();
		toPeerMatched = null;
		this.priority = DEFAULT_PRIORITY;
	}

	public int pushCondition(String param, int matchedType, String value) {
		int result = 0;

		if (null != conditions 
				&& null != param
				&& null != value) {
			RouteRuleCondition tmpCondition = new RouteRuleCondition(param,
					matchedType, value);
			conditions.addElement(tmpCondition);
		} else
			return -1;

		return result;
	}

	public int setCondition(String param, int matchedType, String value,
			int num) {
		int result = 0;
		
		if (null != conditions 
				&& null != param
				&& null != value
				&& (num < conditions.size() && num >= 0)){
			RouteRuleCondition tmpCondition = new RouteRuleCondition(param,
					matchedType, value);
			conditions.add(num, tmpCondition);
		}
		else
			return -1;

		return result;
	}
	
	public int pushConjunction(String conjunction)
	{
		int result = 0;
		
		if (null != conjunctions)
		{
			int a = conjunctions.size();
			conjunctions.put(a+"", conjunction);
		}
		else
			return -1;
		
		return result;
	}
	
//	public int setConjunction(String conjunction, int num)
//	{
//		int result = 0;
//		
//		if (null != conjunctions
//				&& (num >= 0 && num < conjunctions.size()))
//		{
//			conjunctions.put(num+"", conjunction);
//		}
//		else
//			return -1;
//		
//		return result;
//	}

	public int getPriority() {
		return priority;
	}

	public void setPriority(int priority) {
		this.priority = priority;
	}

	public String getToPeerMatched() {
		return toPeerMatched;
	}

	public void setToPeerMatched(String toPeerMatched) {
		this.toPeerMatched = toPeerMatched;
	}
	
	public String getConjunctionString()
	{
		String a = "";
		
		for (int i = 0; i < this.conjunctions.size(); i++) {
			String conjunction = conjunctions.get(i+"");
			if (null == conjunction)
				return null;
			
			a += conjunction;
			a += "&";
		}
		if (a.endsWith("&"))
			a = a.substring(0, a.length() - 1);
		else
			a = null;
		
		return a;
	}
	
	public String getMatchedPeerString()
	{
		String result = "";
		String strCond = "";
		
		result += "\t\tif (";

		if (null != this.conditions && this.conditions.size() > 0)
			strCond += this.conditions.get(0).getConditionMatchedString();
		
		if (null != this.conjunctions)
		{
			int i = 0;
			while (i < this.conjunctions.size())
			{
				String conjunc = "";
				if (CONJUNCTION_AND.equals(this.conjunctions.get(i+"")))
					conjunc = " && ";
				else if (CONJUNCTION_OR.equals(this.conjunctions.get(i+"")))
					conjunc = " || ";
				
				strCond += conjunc;
				strCond += this.conditions.get(i+1).getConditionMatchedString();
				
				i++;
			}
		}
		
		result += strCond;
		
		result += ")\n";
			
		return result;
	}
	
	public String getRouteRuleString()
	{
		String a = "";
		a += this.priority + "&";
		a += this.toPeerMatched + "&";
		for (int i = 0; i < this.conditions.size(); i++) {
			RouteRuleCondition condition = conditions.get(i);
			if (null == condition
					|| null == condition.getConditionString())
				return null;
			
			a += condition.getConditionString();
			a += "&";
		}
		if (a.endsWith("&"))
			a = a.substring(0, a.length() - 1);
		else
			a = null;
		
		return a;
	}
	
	public int parseStringToRouteRule(String strConditions, String strConjunctions)
	{
		int result = 0;
		
		if (null == strConditions
				|| null == strConjunctions)
			return -1;
		
		String[] tmpConditions = strConditions.split("&");
		String[] tmpConjunctions = strConjunctions.split("&");
		
		if (null == tmpConditions
				|| null == tmpConjunctions
				|| (3 > tmpConditions.length)
				|| !Utils.isNumeric(tmpConditions[0])
				|| ((tmpConditions.length != 3) && (tmpConditions.length - 3) != tmpConjunctions.length))
			return -1;
			
		this.priority = Integer.valueOf(tmpConditions[0]);
		this.toPeerMatched = tmpConditions[1];
		
		int i = 2;
		for (; i < tmpConditions.length;i++)
		{
			String strCondition = tmpConditions[i];
			RouteRuleCondition condition = new RouteRuleCondition();
			if (0 != condition.parseStringToCondition(strCondition))
				return -1;
			this.conditions.addElement(condition);
		}
		
		if (tmpConjunctions.length != 0 && !"".equals(tmpConjunctions[0]))
			for (int j = 0; j < tmpConjunctions.length; j++)
			{
				this.conjunctions.put(j+"", tmpConjunctions[j]);
			}
		
		
		return result;
	}

}
