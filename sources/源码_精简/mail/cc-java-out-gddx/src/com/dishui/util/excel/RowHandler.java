package com.dishui.util.excel;

import java.util.List;

public interface RowHandler {
	public void processRow(int sheetIndex, int curRow, List<String> collist);
	
}
