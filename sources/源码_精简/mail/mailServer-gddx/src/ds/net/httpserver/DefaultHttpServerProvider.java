/*
 * @(#)DefaultHttpServerProvider.java	1.3 05/11/17
 *
 * Copyright 2006 Sun Microsystems, Inc. All rights reserved.
 * SUN PROPRIETARY/CONFIDENTIAL. Use is subject to license terms.
 */

package ds.net.httpserver;

import com.dishui.net.httpserver.HttpServer;
import com.dishui.net.httpserver.HttpsServer;
import com.dishui.net.httpserver.spi.HttpServerProvider;

import java.io.IOException;
import java.net.InetSocketAddress;

public class DefaultHttpServerProvider extends HttpServerProvider {
    public HttpServer createHttpServer (InetSocketAddress addr, int backlog) throws IOException {
	return new HttpServerImpl(addr, backlog);
    }

    public HttpsServer createHttpsServer (InetSocketAddress addr, int backlog) throws IOException {
	return new HttpsServerImpl(addr, backlog);
    }
}
