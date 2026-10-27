/*
 * @(#)DefaultHttpServerProvider.java	1.3 05/11/17
 *
 * Copyright 2006 Sun Microsystems, Inc. All rights reserved.
 * SUN PROPRIETARY/CONFIDENTIAL. Use is subject to license terms.
 */

package cc.net.httpserver;

import java.io.IOException;
import java.net.InetSocketAddress;

import com.cc.net.httpserver.HttpServer;
import com.cc.net.httpserver.HttpsServer;
import com.cc.net.httpserver.spi.HttpServerProvider;

public class DefaultHttpServerProvider extends HttpServerProvider {
    public HttpServer createHttpServer (InetSocketAddress addr, int backlog) throws IOException {
	return new HttpServerImpl (addr, backlog);
    }

    public HttpsServer createHttpsServer (InetSocketAddress addr, int backlog) throws IOException {
	return new HttpsServerImpl (addr, backlog);
    }
}
