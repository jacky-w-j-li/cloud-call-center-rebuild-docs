#!/bin/bash

# Configure JAVA_HOME here or in your environment
# JAVA_HOME="/usr/java/latest"

BASEDIR=`dirname ${0}`

. ${BASEDIR}/config-vars.sh

case "$1" in
	"start")
		if [ x${JAVA_HOME} = "x" ]; then
        		echo "JAVA_HOME does not appear to be in your environment."
        		echo "You must define the JAVA_HOME environment variable"
        		echo "in the ${BASEDIR}/config-vars.sh shell script"
        		exit 1
		else
        		if [ ! -e ${JAVA_HOME}/bin/java ]; then
                		echo "JAVA_HOME is defined, but the 'java' executable"
                		echo "cannot be found in:  "
                		echo ""
                		echo "${JAVA_HOME}/bin"
                		echo ""
                		echo "This is a fatal error."
				echo "Verify your JAVA_HOME environment variable is set"
				echo "in ${BASEDIR}/config-vars.sh"
                		exit 1
		
        		fi
		fi

		echo -n "Starting Asterisk Status Server.. "

		cd ${BASEDIR}
		${JAVA_HOME}/bin/java -jar ${BASEDIR}/equinox.jar ${BASEDIR} &
		if [ $? -ne 0 ]; then 
			"Application launch failed.  Exiting."
			exit 1
		else 
			echo "ok"
			echo $! > ${BASEDIR}/ass-server.pid
		fi
		
	;;
	"stop")
		echo -n "Stopping Asterisk Status Server.. "
		cd ${BASEDIR}
		kill -9 `cat ${BASEDIR}/ass-server.pid`
		rm ${BASEDIR}/ass-server.pid
		echo "ok"
	;;
	"restart")
		${0} stop && ${0} start
	;;
	*)
		echo "Usage: ${0} {start|stop|restart}"
	;;
esac
