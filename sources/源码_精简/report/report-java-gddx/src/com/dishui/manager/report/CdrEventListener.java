package com.dishui.manager.report;

import com.dishui.manager.report.model.Event;

import java.util.ArrayList;

/**
 * Created by yaxi on 15-11-12.
 */
public interface CdrEventListener {
    public void addToBuf(Event event);
    public void addToBufList(ArrayList<Event> eventList);
}
