package com.m7.cc.ass.gateway.config.model;

import java.util.HashMap;
import java.util.Hashtable;
import java.util.Vector;

import com.m7.cc.command.Fields;

public class DynamicRouteNode extends Context implements ServicePeer {

	public static final String NAME = "dynamic-route";
	private String toPeerUnmatched = "0";
	
	private String displayName;

	private Vector<RouteRule> routeRules = new Vector<RouteRule>();

	public DynamicRouteNode(String exten) {
		super(exten + "-" + NAME, exten);
		this.displayName = "dynamicroutenode-" + exten;
	}

	public void setValue(Hashtable<String, String> data) {				 
		if (data.containsKey(Fields.RouteRules)
				&& data.containsKey(Fields.Conjunctions))
			this.parseStringToRules(data.get(Fields.RouteRules), data.get(Fields.Conjunctions));
		
		if (data.containsKey(Fields.ToPeerUnmatched))
			this.setToPeerUnmatched(data.get(Fields.ToPeerUnmatched));		 
	}

	public Vector<RouteRule> getRouteRules() {
		return routeRules;
	}

	public void addRouteRule(RouteRule routeRule) {
		if (routeRule != null)
			routeRules.add(routeRule);
	}

	public void addRouteRuleOrderPriority(RouteRule routeRule) {
		if (routeRule == null)
			routeRules = new Vector<RouteRule>();

		int i = 0;
		while (i < routeRules.size()) {
			if (routeRules.get(i).getPriority() >= routeRule.getPriority())
				break;
			i++;
		}

		routeRules.insertElementAt(routeRule, i);

	}

	public String getConjunctionsString() {
		String a = "";

		for (int i = 0; i < routeRules.size(); i++) {
			RouteRule rule = routeRules.get(i);
			if (null == rule || null == rule.getConjunctionString())
				return null;

			a += rule.getConjunctionString();
			a += "@";
		}
		if (a.endsWith("@"))
			a = a.substring(0, a.length() - 1);
		else
		{
			if (!"".equals(a))
				a = null;
		}
		return a;
	}

	public String getRouteRulesString() {
		String a = "";
		for (int i = 0; i < routeRules.size(); i++) {
			RouteRule rule = routeRules.get(i);
			if (null == rule || null == rule.getRouteRuleString())
				return null;

			a += rule.getRouteRuleString();
			a += "@";
		}
		if (a.endsWith("@"))
			a = a.substring(0, a.length() - 1);
		else
		{
			if (!"".equals(a))
				a = null;
		}
			
		return a;
	}

	public String getMatchedString() {
		String result = null;
		
		
		
		return result;
	}

	public String getActionString() {
		return "goto " + this.getContext() + ",s,1";
	}

	public String getActionString(String param) {
		if (null == param)
			return null;

		return "goto " + this.getContext() + ", " + param + ", 1";
	}

	public void setValues(HashMap<String, Object> map) {
		// TODO Auto-generated method stub

	}

	public String getServicePeerName() {
		return NAME;
	}

	public void addValues(HashMap<String, Object> map) {
		// TODO Auto-generated method stub

	}

	public String getToPeerUnmatched() {
		return toPeerUnmatched;
	}

	public void setToPeerUnmatched(String toPeerUnmatched) {
		this.toPeerUnmatched = toPeerUnmatched;
	}

	public void constructActionString() {

	}

	public int parseStringToRules(String rules, String conjunctions) {
		int result = 0;
		if (null == rules  || null == conjunctions)
			return -1;
		
		if ("".equals(rules))
		{
			if (null == this.routeRules)
				this.routeRules = new Vector<RouteRule>();
			else
				this.routeRules.clear();
			return 0;
		}

		String[] routeRules = rules.split("@");
		String[] allConjunctions = conjunctions.split("@");

		if (null == routeRules || null == allConjunctions
				|| 0 == routeRules.length || 0 == allConjunctions.length
				|| routeRules.length != allConjunctions.length)
			return -1;

		int i = 0;
		for (; i < routeRules.length; i++) {
			RouteRule tmpRouteRule = new RouteRule();
			if (0 != tmpRouteRule.parseStringToRouteRule(routeRules[i],
					allConjunctions[i]))
				return -1;
			this.addRouteRuleOrderPriority(tmpRouteRule);
		}
		
		////////Aman test

		return result;
	}
	
	public String getDisplayName() {
		return displayName;
	}

	public void setDisplayName(String displayName) {
		if (null == displayName)
			this.displayName = "dynamicroutenode-" + ((null == this.getExten())? "0" : this.getExten());
		else
			this.displayName = displayName;
	}

}
