package com.dishui.model;

import java.io.Serializable;
import java.util.List;

public class VOResult<T> implements Serializable {
	
	private List<T> result;
	
	public VOResult(List<T> result) {
		this.result = result;
		if (result != null) {
			this.rowNumber = result.size();
		}
	}
	
    //当前结果集行数
    private int rowNumber = -1;
    //结果集总行数
    private long totalRow = 0;

    //当前页码号
    private int beginPage = 0;
    //每页最大记录数,默认每页大小为10页
    private int pageSize = 10;

	public List<T> getResult() {
		return result;
	}

	public void setResult(List<T> result) {
		this.result = result;
	}
	
    public VOResult(List<T> result, long totalRow) {
        this.result = result;
        this.totalRow = totalRow;
        if (result != null) {
            rowNumber = result.size();
        }
    }	

	public int getRowNumber() {
		return rowNumber;
	}

	public void setRowNumber(int rowNumber) {
		this.rowNumber = rowNumber;
	}

	public long getTotalRow() {
		return totalRow;
	}

	public void setTotalRow(long totalRow) {
		this.totalRow = totalRow;
	}

	public int getBeginPage() {
		return beginPage;
	}

	public void setBeginPage(int beginPage) {
		this.beginPage = beginPage;
	}

	public int getPageSize() {
		return pageSize;
	}

	public void setPageSize(int pageSize) {
		this.pageSize = pageSize;
	}

	public VOResult() {
		super();
	}

}
