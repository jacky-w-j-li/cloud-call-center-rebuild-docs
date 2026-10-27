BASEDIR=`dirname ${0}`
. ${BASEDIR}/config-vars.sh
case "$1" in
        "start")
		if [ x${NODE_HOME} = "x" ]; then
		                        echo "NODE_HOME does not appear to be in your environment."
		                        echo "You must define the NODE_HOME environment variable"
		                        echo "in the ${BASEDIR}/config-vars.sh shell script"
		                        exit 1
		                else
		                        if [ ! -e ${NODE_HOME}/bin/node ]; then
		                                echo "NODE_HOME is defined, but the 'node' executable"
		                                echo "cannot be found in:  "
		                                echo ""
		                                echo "${NODE_HOME}/bin"
		                                echo ""
		                                echo "This is a fatal error."
		                                echo "Verify your NODE_HOME environment variable is set"
		                                echo "in ${BASEDIR}/config-vars.sh"
		                                exit 1

		                        fi
		                fi

						echo -n "Starting  Server.. "
						cd ${BASEDIR}
						nohup ${NODE_HOME}/bin/node ${BASEDIR}/startup.js > /dev/null &
						if [ $? -ne 0 ]; then
						                        "app launch failed.  Exiting."
						                        exit 1
						else
						                        echo "ok"
						                        echo $! > ${BASEDIR}/node-server.pid
						fi
				;;
		        "stop")
		                echo -n "Stopping  Server.. "
		                cd ${BASEDIR}
		                kill -9 `cat ${BASEDIR}/node-server.pid`
		                rm ${BASEDIR}/node-server.pid
		                echo "ok"
		        ;;
				"restart")
				                ${0} stop && ${0} start
				        ;;
				        *)
				                echo "Usage: ${0} {start|stop|restart}"
				        ;;
				esac
