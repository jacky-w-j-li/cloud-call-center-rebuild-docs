package com.m7.cc.util;

import java.util.Vector;

public class IceQueue {
	private Vector<Object> vector = null;
	
	public IceQueue(){
		vector = new Vector<Object>();
	}
	public void add(Object str){
		vector.add(str);
	}
	public boolean isEmpty(){
		if(vector.size() == 0)
			return true;
		return false;
	}
	public Object remove() throws Exception{
		Object str = null;
		if(vector.size()>0){
			str = vector.remove(0);
			return str;
		}else throw new Exception("The queue is empty now, can not remove anymore.");
	}
	
	public void clear(){
		vector.clear();
	}
	
	public int size(){
		return vector.size();
	}
}
