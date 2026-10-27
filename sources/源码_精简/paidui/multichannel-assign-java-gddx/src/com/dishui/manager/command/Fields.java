package com.dishui.manager.command;

/**
 * All keys system used will be defined in this class.
 * @author Cai Zhibin
 *
 */
public class Fields {
	
	public static final String SipPeer = "SipPeer";
	
	public static final String Duration = "Duration";
	
	
	public static final String CallUrl = "CallUrl";
	
	public final static String ONLINE = "0";
	public final static String AWAY = "1";
	public final static String DND = "2";
	public final static String BUSY = "99";
	public final static String PROWL = "100";
	public final static String OFFLINE = "101";
	
	public static final String SipNo = "SipNo";
	public static final String GWNo = "GWNo";
	public static final String LocalNo = "LocalNo";
	public static final String SipSecret = "SipSecret";
	public static final String SipIP = "SipIP";
	public static final String SipPort = "SipPort";
	public final static String IsAdmin = "IsAdmin";
	
	public static final String Announcement = "Announcement";
	public static final String BlackList = "BlackList";
	public static final String IVR = "IVR";
	public static final String TimeCondition = "TimeCondition";
	public static final String DynamicRoute = "DynamicRoute";
	public static final String Assignment = "Assignment";
	public static final String DialJobNum = "DialJobNum";
	
	public static final String GetCallSheet = "GetCallSheet";
	public static final String GetSqlCount = "GetSqlCount";
	
	public static final int SIP = 0;
	public static final int QUEUE = 1;
	public static final int AEL = 2;
	public static final int ALL = 3;
	
	public static final String GetMessageTempFile = "GetMessageTempFile";
	public static final String UploadMessageTempFile = "UploadMessageTempFile";
	public static final String PMailReply = "PMailReply";
	public static final String GetPMailReply = "GetPMailReply";
	public static final String GetSMailReply = "GetSMailReply";
	public static final String GetSMail = "GetSMail";
	public static final String GetCalendar = "GetCalendar";
	public static final String ModifyCalendar = "ModifyCalendar";
	public static final String DeleteCalendar = "DeleteCalendar";
	public static final String Weibo = "Weibo";
	public static final String Email = "Email";
	public static final String Picture = "Picture";
	public static final String Command = "Command";
	public static final String Event = "Event";
	public static final String EventID = "EventID";
	public static final String Action = "Action";
	public static final String Response = "Response";
	public static final String LastUpdate = "LastUpdate";
	public static final String ComparisonOperator = "ComparisonOperator";
	public static final String OpenSMail = "OpenSMail";
	public static final String GetUpdatedUser = "GetUpdatedUser";
	public static final String GetUserState = "GetUserState";
	public static final String GetNewPMailReply = "GetNewPMailReply";
	public static final String Reason = "Reason";
	public static final String ActionID = "ActionID";
	public static final String DialoutActionID = "DialoutActionID";
	public static final String END_LINE = "\r\n";
	public static final String END_ACTION = "\r\n";
	public static final String Asterisk = "Asterisk";
	public static final String Succeed = "Succeed";
	public static final String Message = "Message";
	public static final String MessageType = "MessageType";
	public static final String Platform = "Platform";
	public static final String Windows = "Windows";
	public static final String Mac = "Mac";
	public static final String IPhone = "IPhone";
	public static final String Android = "Android";
	public static final String MessageReply = "MessageReply";
	public static final String HasEvent = "HasEvent";
	public static final String ConnectType = "__CONNECT_TYPE";
	public static final String SkillGroupNo = "SkillGroupNo";
	public static final String AsteriskDown = "AsteriskDown";
	public static final String AsteriskReload = "AsteriskReload";
	public static final String id = "id";
	public static final String SessionID = "SessionID";
	public static final String Session = "Session";
	public static final String Result = "Result";
	public static final String Ping = "Ping";
	public static final String DisposalAgent = "DisposalAgent";
	public static final String DisposalAgent1 = "DisposalAgent1";
	public static final String C5Fields = "C5Fields";
	public static final String FromCid = "FromCid";
	public static final String FromDid = "FromDid";
	public static final String Account = "Account";
	public static final String AccountStatus = "AccountStatus";
	public static final String AccountName = "AccountName";
	public static final String MonitorFilename = "MonitorFilename";
	public static final String CustomerID = "CustomerID";
	public static final String WorkSheetID = "WorkSheetID";
	public static final String workSheetId = "workSheetId";
	public static final String GetUpdatedFeedCount = "GetUpdatedFeedCount";
	
	public static final String Mobile = "Mobile";
	public static final String UserPictureUpdate = "UserPictureUpdate";
	public static final String Calendar = "Calendar";
	public static final String CalendarRemove = "CalendarRemove";
	public static final String CalendarComplete = "CalendarComplete";
	
	public static final String UploadSMailFile = "UploadSMailFile";
	public static final String DeleteSMailFile = "DeleteSMailFile";
	public static final String GetSMailFile = "GetSMailFile";
	
	public static final String FromExten = "FromExten";
	public static final String ValidateNo = "ValidateNo";
	public static final String Connected = "Connected";
	public static final String Authenticated = "Authenticated";
	public static final String Content = "Content";
	public static final String CreateCalendar = "CreateCalendar";
	
	public static final String ObjectName = "ObjectName";
	public static final String Address = "Address";
	public static final String Port = "Port";
	public static final String Online = "Online";
	public static final String ChanSpy = "ChanSpy";
	public static final String Offline = "Offline";
	public static final String SMail = "SMail";
	public static final String SMailReply = "SMailReply";
	public static final String FromChannel = "FromChannel";
	public static final String ParkChannel = "ParkChannel";
	
	public static final String GetNotifyMessage = "GetNotifyMessage";
	public static final String GetNotify = "GetNotify";
	public static final String UserID = "UserID";
	public static final String Limit = "Limit";
	public static final String GetLastChatSession = "GetLastChatSession";
	public static final String DidNum = "DidNum";
	public static final String Password = "Password";
	public static final String PBX = "PBX";
	public static final String ExtenType = "ExtenType";
	public static final String MyQueue = "MyQueue";
	public static final String AutoBusy = "AutoBusy";
	public static final String AutoBusyTime = "AutoBusyTime";
	public static final String ActionType = "ActionType";
	public static final String Filename = "Filename";
	public static final String FileSize = "FileSize";
	public static final String GetConfig = "GetConfig";
	public static final String Investigate = "Investigate";
	public static final String Attachment = "Attachment";
	public static final String Send = "Send";
	public static final String Accept = "Accept";
	public static final String Cancel = "Cancel";
	public static final String Reject = "Reject";
	public static final String Secret = "Secret";
	public static final String User = "User";
	public static final String Group = "Group";
	public static final String Flash = "Flash";
	public static final String DeleteMessageTempFile = "DeleteMessageTempFile";
	public static final String TempGroup = "TempGroup";
	public static final String Datetime = "Datetime";
	public static final String PageNum = "PageNum";
	public static final String PageSize = "PageSize";
	public static final String TotalPage = "TotalPage";
	public static final String CurrentPage = "CurrentPage";
	public static final String Reserve = "Rserve";
	public static final String UserStatus = "UserStatus";
	public static final String UserName = "UserName";
	public static final String ServiceNo = "ServiceNo";
	public static final String DialoutPrefix = "DialoutPrefix";
	public static final String Dialout = "Dialout";
	public static final String TransferPrefix = "TransferPrefix";
	public static final String Peers = "Peers";
	public static final String Queues = "Queues";
	public static final String Peer = "Peer";
	public static final String Channel = "Channel";
	public static final String P2PFile = "P2PFile";
	public static final String Check = "Check";
	public static final String Value = "Value";
	public static final String ChannelType = "ChannelType";
	public static final String Exten = "Exten";
	public static final String Title = "Title";
	public static final String DialextenNode = "DialextenNode"; // Aman zhai. 2010.06.08 
	public static final String Extension = "Extension";
	public static final String C5Status = "C5Status";
	public static final String RestTime = "RestTime";
	public static final String Rest = "Rest";
	public static final String Timeout = "Timeout";
	public static final String Times = "Times";
	public static final String DaysOfWeek = "DaysOfWeek";
	public static final String DaysOfMoth = "DaysOfMoth";
	public static final String Moths = "Moths";
	public static final String MatchedPeer = "MatchedPeer";
	public static final String UnmatchedPeer = "UnmatchedPeer";
	public static final String CallerID = "CallerID";
	public static final String CallerIDNum = "CallerIDNum";
	public static final String CallerIDName = "CallerIDName";
	public static final String Linked = "Linked";
	public static final String Timestamp = "Timestamp";
	public static final String LinkedChannel = "LinkedChannel";
	public static final String LinkedUniqueid = "LinkedUniqueid";
	public static final String LinkedChannelType = "LinkedChannelType";
	public static final String LinkedChannelCallerIDName = "LinkedChannelCallerIDName";
	public static final String LinkedChannelCallerIDNum = "LinkedChannelCallerIDNum";
	public static final String EventName = "EventName";
	public static final String Data = "Data";
	public static final String Async = "Async";
	public static final String Variable = "Variable";
	public static final String BusyTimestamp = "BusyTimestamp";
	public static final String LoginTimestamp = "LoginTimestamp";
	public static final String Browser = "Browser";
	
	public static final String ListenExten = "ListenExten";
	
	public static final String Max = "Max";
	public static final String Min = "Min";
	public static final String Calls = "Calls";
	public static final String TotalCalls = "TotalCalls";
	public static final String Holdtime = "Holdtime";
	public static final String HoldTime = "HoldTime";
	public static final String TalkTime = "TalkTime";
	public static final String BridgedChannel = "BridgedChannel";
	public static final String Completed = "Completed";
	public static final String Abandoned = "Abandoned";
	public static final String ServiceLevel = "ServiceLevel";
	public static final String ServicelevelPerf = "ServicelevelPerf";
	public static final String Weight = "Weight";
	public static final String Queue = "Queue";
	public static final String QueueName = "QueueName";
	public static final String Members = "Members";
	public static final String BusyMembers = "BusyMembers";
	public static final String CallType = "CallType";
	public static final String Agent = "Agent";
	public static final String ChangeState = "ChangeState";
	public static final String TempGroupAdd = "TempGroupAdd";
	public static final String GroupAdd = "GroupAdd";
	public static final String GetUpdateGroup = "GetUpdateGroup";
	public static final String GetTempGroup = "GetTempGroup";
	public static final String GetGroup = "GetGroup";
	
	public static final String AgentCalled = "AgentCalled";
	public static final String AgentConnect = "AgentConnect";
	public static final String AgentComplete = "AgentComplete";
	
	public static final String InCalls = "InCalls";
	public static final String InCallsPerHour = "InCallsPerHour";
	public static final String InComplete = "InComplete";
	public static final String InCompletePerHour = "InCompletePerHour";
	public static final String InLost = "InLost";
	public static final String OutCalls = "OutCalls";
	public static final String OutCallsPerHour = "OutCallsPerHour";
	public static final String OutComplete = "OutComplete";
	public static final String OutCompletePerHour = "OutCompletePerHour";
	public static final String CurrentInCalls = "CurrentInCalls";
	public static final String CurrentOutCalls = "CurrentOutCalls";
	public static final String TempGroupAddMember="TempGroupAddMember";
	public static final String TempGroupRemoveMember="TempGroupRemoveMember";
	public static final String GroupAddMember="GroupAddMember";
	public static final String GroupRemoveMember="GroupRemoveMember";
	public static final String QueueMember = "QueueMember";
	public static final String Location = "Location";
	public static final String LocationId = "LocationId";
	public static final String LocationName = "LocationName";
	public static final String Membership = "Membership";
	public static final String CallsTaken = "CallsTaken";
	public static final String LastCall = "LastCall";
	public static final String Static = "Static";
	public static final String Dynamic = "Dynamic";
	public static final String Name = "Name";
	public static final String Version = "Version";
	public static final String Nat = "Nat";
	public static final String Type = "Type";
	public static final String Host = "Host";
	public static final String Canreinvite = "Canreinvite";
	public static final String CallLimit = "call-limit";
	public static final String Qualify = "Qualify";
	public static final String Allow = "Allow";
	public static final String Paused = "Paused";
	public static final String Status = "Status";
	public static final String State = "State";
	public static final String From = "From";
	public static final String Participant = "Participant";
	public static final String To = "To";
	public static final String At = "At";
	public static final String Parked = "Parked";
	public static final String Park = "Park";
	public static final String RingTime = "RingTime";
	
	public static final String ChannelStatus = "ChannelStatus";
	public static final String Newchannel = "Newchannel";
	public static final String Unlink = "Unlink";
	public static final String Link = "Link";
	public static final String Listen = "Listen";
	
	public static final String Notify = "Notify";
	
	public static final String Application = "Application";
	public static final String Priority = "Priority";
	public static final String AppData = "AppData";
	public static final String Context = "Context";
	public static final String MusicClass = "MusicClass";
	public static final String Music = "Music";
	public static final String Strategy = "Strategy";
	public static final String Retry = "Retry";
	public static final String MonitorJoin = "MonitorJoin";
	public static final String MonitorFormat = "MonitorFormat";
	public static final String EventMemberStatus = "EventMemberStatus";
	public static final String EventWhenCalled = "EventWhenCalled";
	public static final String RingInuse = "RingInuse";
	public static final String JoinEmpty = "JoinEmpty";
	public static final String WrapUpTime = "WrapUpTime";
	public static final String WaitTime = "WaitTime";
	public static final String ToPeerWhenQueueEmpty = "ToPeerWhenQueueEmpty";
	public static final String ToPeerWhenWaitTimeout = "ToPeerWhenWaitTimeout";
	public static final String ReturnPeer = "ReturnPeer";
	public static final String RetryTime = "RetryTime";
	
	//event queueEntry
	public static final String QueueEntry = "QueueEntry";
	public static final String Position = "Position";
	public static final String Wait = "Wait";
	
	//event join
	public static final String Join = "Join";
	public static final String Count = "Count";
	public static final String Leave = "Leave";
	
	//event queue caller abandon
	public static final String QueueCallerAbandon = "QueueCallerAbandon";
	public static final String OriginalPosition = "OriginalPosition";
	
	//queue add
	public static final String Interface = "Interface";
	public static final String MemberName = "MemberName";
	public static final String Penalty = "Penalty";
	public static final String Local = "Local";
	public static final String LocalMember = "LocalMember";
	public static final String Removed = "Removed";
	public static final String Left = "Left";
	public static final String Uniqueid = "Uniqueid";
	public static final String OriginalUniqueid = "OriginalUniqueid";
	
	public static final String AppQueueAdd = "AppQueueAdd";
	
	//queue pause
	public static final String QueuePause = "QueuePause";
	public static final String QueueRemove = "QueueRemove";
	public static final String QueueAdd = "QueueAdd";
	
	//event queue member added
	public static final String QueueMemberAdded = "QueueMemberAdded";
	
	//event queue member removed
	public static final String QueueMemberRemoved = "QueueMemberRemoved";
	
	//event queue member paused
	public static final String QueueMemberPaused = "QueueMemberPaused";
	
	//cdr
	public static final String ChannelCdr = "ChannelCdr";
	public static final String CallCdr = "CallCdr";
	public static final String PeerCallCdr = "PeerCallCdr";
	public static final String PeerCdr = "PeerCdr";
	public static final String QueueEntryCdr = "QueueEntryCdr";
	public static final String QueueMemberCdr = "QueueMemberCdr";
	public static final String Sequence = "Sequence";
	
	//call cdr
	public static final String CallSheetID = "CallSheetID";
	public static final String CallNo = "CallNo";
	public static final String CalledNo = "CalledNo";
	public static final String BeginTime = "BeginTime";
	public static final String EndTime = "EndTime";
	public static final String NotifyTime = "NotifyTime";
	public static final String OfferingTime = "OfferingTime";
	public static final String QueueTime = "QueueTime";
	public static final String RecordFileName = "RecordFileName";
	public static final String OriginID = "OriginID";
	public static final String RefCallSheetID = "RefCallSheetID";
	public static final String RefUniqueid = "RefUniqueid";
	public static final String CallID = "CallID";
	public static final String OpType = "OpType";
	public static final String LoginUser = "LoginUser";
	public static final String LoginName = "LoginName";
	public static final String LoginExten = "LoginExten";
	public static final String Direction = "Direction";
	public static final String ErrorMemo = "ErrorMemo";
	public static final String Comments = "Comments";
	
	//Action
	public static final String Kick = "Kick";
	public static final String Login = "Login";
	public static final String Busy = "Busy";
	public static final String UserBusy = "UserBusy";
	public static final String UserLogin = "UserLogin";
	public static final String UserUpdate = "UserUpdate";
	public static final String UserDisable = "UserDisable";
	public static final String UserPasswordUpdate = "UserPasswordUpdate";
	public static final String UserCallsUpdate = "UserCallsUpdate";
	public static final String UserSignIn = "UserSignIn";
	public static final String UserSignOut = "UserSignOut";
	public static final String Consult = "Consult";
	public static final String StopConsult = "StopConsult";
	public static final String Hangup = "Hangup";
	public static final String Transfer = "Transfer";
	public static final String Transfer1 = "Transfer1";
	public static final String Monitor = "Monitor";
	public static final String ToIVR = "ToIVR";
	public static final String AddQueueAgent = "AddQueueAgent";
	public static final String RemoveQueueAgent = "RemoveQueueAgent";
	public static final String Logoff = "Logoff";
	public static final String GetState = "GetState";
	public static final String Originate = "Originate";
	public static final String ExtraChannel = "ExtraChannel";
	public static final String ListenQueueState = "ListenQueueState";
	public static final String SetVar = "SetVar";
	public static final String Redirect = "Redirect";
	public static final String CdrLogin = "CdrLogin";
	public static final String Reload = "Reload";
	public static final String SetExtenType = "SetExtenType";
	public static final String GetChatHistory = "GetChatHistory";
	public static final String Webcall = "Webcall";
	public static final String Validate = "Validate";
	public static final String Stop = "Stop";
	public static final String ToPeer = "ToPeer";
	public static final String NextPeer = "NextPeer";
	
	//C5Command-----------------------------------------------------
	public static final String GetPBXStatus = "GetPBXStatus";
	public static final String GetQueueStatus = "GetQueueStatus";
	public static final String GetPeerStatus = "GetPeerStatus";
	public static final String GetUserStatus = "GetUserStatus";
	public static final String GetUser = "GetUser";
	public static final String GetChannelStatus = "GetChannelStatus";
	public static final String Help = "Help";
	//C5Command-----------------------------------------------------
	
	//Event
	public static final String PeerStatus = "PeerStatus";
	public static final String Voicemail = "Voicemail";
	public static final String QueueParams = "QueueParams";
	public static final String TrunkStatus = "TrunkStatus";
	public static final String ParkedCall = "ParkedCall";
	public static final String UnParkedCall = "UnParkedCall";
	public static final String ParkedCallTimeOut = "ParkedCallTimeOut";
	public static final String ParkedCallGiveUp = "ParkedCallGiveUp";
	public static final String Newexten = "Newexten";
	
	
	public static final String Style = "Style";
	public static final String Expression = "Expression";
	public static final String List = "List";
	public static final String IvrKey = "IvrKey";
	public static final String Update = "Update";
	public static final String Active = "Active";
	public static final String NeedPrefix = "NeedPrefix";
	public static final String SipNum = "SipNum";
	public static final String HoldMusic = "HoldMusic";
	public static final String IsHoldMusic = "IsHoldMusic";
	public static final String DialPlan = "DialPlan";
	
	//down|up|ring|ringing|busy|link|unlink|hangup
	public static final String Down = "Down";
	public static final String Up = "Up";
	public static final String Ring = "Ring";
	public static final String Ringing = "Ringing";
	
	public static final String inner = "inner";
	public static final String normal = "normal";
	public static final String dialout = "dialout";
	public static final String dialTransfer = "dialTransfer";
	public static final String transfer = "transfer";
	public static final String webcall = "webcall";
	public static final String none = "none";
	public static final String listen = "listen";
	public static final String validate = "validate";
	
	

	public static final String leak = "leak";
	public static final String queueLeak = "queueLeak";
	public static final String blacklist = "blacklist";
	public static final String dealing = "dealing";
	public static final String notDeal = "notDeal";
	
	public static final String investigate = "investigate";
	public static final String investigate_result = "investigate-result";
	public static final String voicemail = "voicemail";
	public static final String voicemail_end = "voicemail-end";
	public static final String voicemail_start = "voicemail-start";
	
	public static final String Path = "Path";
	
	public static final String ToPeerWhenHanguped = "ToPeerWhenHanguped";
	public static final String ExtensionPeer = "ExtensionPeer";
	
	public static final String MusicAdd = "MusicAdd";
	public static final String PicAdd = "PicAdd";
	public static final String UserPicAdd = "UserPicAdd";
	public static final String AccountAdd = "AccountAdd";
	public static final String AccountRemove = "AccountRemove";
	public static final String AccountActive = "AccountActive";
	public static final String BlackListAdd = "BlackListAdd";
	public static final String IVRAdd = "IVRAdd";
	public static final String ServiceNoAdd = "ServiceNoAdd";
	public static final String AddSip = "AddSip";
	public static final String TimeConditionAdd = "TimeConditionAdd";
	public static final String UserAdd = "UserAdd";
	public static final String UserRemove = "UserRemove";
	public static final String AnnouncementAdd = "AnnouncementAdd";
	public static final String DialLineAdd = "DialLineAdd";
	public static final String ValidateAdd = "ValidateAdd";
	public static final String FileDelete = "FileDelete";
	public static final String File = "File";
	public static final String HoldMusicRemove = "HoldMusicRemove";
	public static final String SetInvestigateMusic = "SetInvestigateMusic";
	public static final String PeerAdd = "PeerAdd";
	public static final String PeerRemove = "PeerRemove";
	public static final String PeerEffect = "PeerEffect";
	public static final String SipAdd = "SipAdd";
	public static final String PreChannelType = "PreChannelType";
	public static final String GetBundle = "GetBundle";
	public static final String GetAccountStatus = "GetAccountStatus";
	public static final String gc = "gc";
	public static final String SignIn = "SignIn";
	public static final String SignOut = "SignOut";
	public static final String GetUpdatedFeed = "GetUpdatedFeed";
	public static final String GetFeed = "GetFeed";
	public static final String PMail = "PMail";
	
	public static final String HttpDialoutPermit = "HttpDialoutPermit";
	public static final String HttpTransferPermit = "HttpTransferPermit";
	public static final String ExtenFields = "ExtenFields";
	public static final String EventInterfaceAdd = "EventInterfaceAdd";
	public static final String EventInterfaceRemove = "EventInterfaceRemove";
	public static final String EventType = "EventType";
	public static final String ConcreteType = "ConcreteType";
	public static final String Url = "Url";
	public static final String AccountExtenUpdate = "AccountExtenUpdate";
	public static final String AccountExtenRemove = "ExtenAccountRemove";
	public static final String Fields = "Fields";
	public static final String Loot = "Loot";
	public static final String Follow = "Follow";
	
	public static final String ToPeerWhenTimeout = "ToPeerWhenTimeout";
	public static final String DialextenNodeAdd = "DialextenNodeAdd";
	public static final String DialextenNodeRemove = "DialextenNodeRemove";
	public static final String DynamicRouteNodeAdd = "DynamicRouteNodeAdd";
	public static final String DynamicRouteNodeRemove = "DynamicRouteNodeRemove";
	public static final String ExtenLen = "ExtenLen";
	
	public static final String AssignmentNodeAdd = "AssignmentNodeAdd";
	public static final String DialJobNumNodeAdd = "DialJobNumNodeAdd";
	public static final String Unfollow = "Unfollow";
	public static final String RouteRules = "RouteRules";
	public static final String Conjunctions = "Conjunctions";
	public static final String ToPeerUnmatched = "ToPeerUnmatched";
	// <--
	
	public static final String ShowRingURL = "ShowRingURL";
	public static final String RingURL = "RingURL";
	public static final String RingingURL = "RingingURL";
	public static final String LinkURL = "LinkURL";
	public static final String HanupURL = "HanupURL";
	public static final String PeerURL = "PeerURL";
	public static final String HttpTransfer = "HttpTransfer";
	
	public static final String ThreeWayCall = "ThreeWayCall";
	
	
	public static final String EndType = "EndType";
	public static final String EndLength = "EndLength";
	public static final String ReturnKey = "ReturnKey";
	public static final String EndKey = "EndKey";
	
	public static final String DialJobNumParam = "DialJobNumParam";
	
	public static final String Hold = "Hold";
	public static final String Unhold = "Unhold";
	
	//context for new api
	public static final String musiconhold = "musiconhold";
	public static final String threewaycall = "threewaycall";
	
	public static final String MeetmeTalking = "MeetmeTalking";
	public static final String MeetmeStopTalking = "MeetmeStopTalking";
	public static final String MeetmeLeave = "MeetmeLeave";
	public static final String MeetmeJoin = "MeetmeJoin";
	public static final String Meetme = "Meetme";
	public static final String MeetmeMute = "MeetmeMute";
	public static final String OriginateResponse = "OriginateResponse";
	
	public static final String MaxIncomingCalls = "MaxIncomingCalls";
	public static final String MaxOutboundCalls = "MaxOutboundCalls";
	

	public static final String DisplayName = "DisplayName";
	public static final String Key = "Key";
	
	//agi
	public static final String agi_network = "agi_network";
	public static final String agi_network_script = "agi_network_script";
	public static final String agi_request = "agi_request";
	public static final String agi_channel = "agi_channel";
	public static final String agi_language = "agi_language";
	public static final String agi_type = "agi_type";
	public static final String agi_uniqueid = "agi_uniqueid";
	public static final String agi_version = "agi_version";
	public static final String agi_callerid = "agi_callerid";
	public static final String agi_calleridname = "agi_calleridname";
	public static final String agi_callingpres = "agi_callingpres";
	public static final String agi_callingani2 = "agi_callingani2";
	public static final String agi_callington = "agi_callington";
	public static final String agi_callingtns = "agi_callingtns";
	public static final String agi_dnid = "agi_dnid";
	public static final String agi_rdnis = "agi_rdnis";
	public static final String agi_context = "agi_context";
	public static final String agi_extension = "agi_extension";
	public static final String agi_priority = "agi_priority";
	public static final String agi_enhanced = "agi_enhanced";
	public static final String agi_accountcode = "agi_accountcode";
	public static final String agi_threadid = "agi_threadid";
	
	public static final String callurl = "callurl";
	public static final String AgiSayExten = "AgiSayExten";
	public static final String AgiCallUrl = "AgiCallUrl";
	public static final String AgiTssZh = "AgiTtsZh";
	public static final String AgiMD5 = "agiEncryptMD5";
	public static final String SayExten = "SayExten";
	public static final String MD5 = "MD5";
	public static final String HandlerType = "HandlerType";
	
	public final static String ChatMessage = "ChatMessage";
	public final static String ChatSession = "ChatSession";
	public final static String ChatPeerList = "ChatPeerList";
	public final static String StatusComplete = "StatusComplete";
	public final static String NewChatSession = "NewChatSession";
	public final static String Creator = "Creator";
	public final static String CreateDate = "CreateDate";
	public final static String UserList = "UserList";
	public final static String NewMessage = "NewMessage";
	public final static String FollowMessage = "FollowMessage";
	public final static String ContentFile = "ContentFile";
	public final static String ContentLength = "ContentLength";
	public final static String ContentType = "ContentType";
	public final static String MemberJoin = "MemberJoin";
	public final static String MemberLeave = "MemberLeave";
	public final static String MessageID = "MessageID";
	public final static String CheckResult = "CheckResult";
	public final static String FileServer = "FileServer";
	
	public final static String sip = "sip";
	public final static String gateway = "gateway";
	
	/*
	 * Add by yangwl
	 * 2011-03-10 
	 * == begin ==
	 */
	public final static String TextAnnouncement = "textannouncement";
	public static final String AnnouncementText = "AnnouncementText";
	public static final String WordInterval = "WordInterval";
	public static final String SignInterval = "SignInterval";
	public static final String IsMoney = "IsMoney";
	
	public static final String EncryptMD5 = "encryptmd5";
	public static final String EncryptText = "EncryptText";
	
	public static final String SayQueuePosition = "SayQueuePosition";
	
	public static final String PhonebarConfig = "phonebarconfig";
	public static final String B00 = "0";
	public static final String B01 = "1";
	public static final String B02 = "2";
	public static final String B03 = "3";
	public static final String B04 = "4";
	public static final String B05 = "5";
	public static final String B06 = "6";
	public static final String B07 = "7";
	public static final String B08 = "8";
	public static final String B09 = "9";
	public static final String B99 = "99";
	public static final String PhonebarConfigKey = "PhonebarConfig";
	
	public static final String BusyType = "BusyType";
	
	public static final String AfterCallWork ="AfterCallWork";
	public static final String AGIHost = "127.0.0.1:7891";
	/* == end == */
	
	public static final String Domain = "Domain";
	public static final String DomainRemove="DomainRemove";
	public static final String RouteConfig="RouteConfig";
	public static final String XferFlag = "0";
	public static final String DialoutFlag = "1";
	public static final String Statistic = "STATISTIC";
	
	//Batch Dialout
	public static final String BatchDialout = "BatchDialout";
	public static final String BatchDialoutType = "BatchDialoutType";
	public static final String BatchDialoutAnnouncement = "0";
	public static final String BatchDialoutAgentCall = "1";
	public static final String CallNumber = "CallNumber";
	public static final String Description = "Description";
	
	public static final String StartWeibo = "StartWeibo";
	public static final String FindPassword = "FindPassword";
	public static final String Conference = "Conference";
	public static final String AddConference = "AddConference";
	public static final String ConferenceUpdate = "ConferenceUpdate";
	public static final String ConferenceRemove = "ConferenceRemove";
	public static final String GetConference = "GetConference";
	public static final String GetConferenceCalendar = "GetConferenceCalendar";
	public static final String NotifySelection = "NotifySelection";
	
	public static final String Parent = "Parent";
	public static final String Root = "Root";
	public static final String Department = "Department";
	public static final String Admin = "Admin";
	public static final String Member = "Member";
	public static final String SubDepartment = "SubDepartment";
	public static final String AddDepartment = "AddDepartment";
	public static final String ModifyDepartment = "ModifyDepartment";
	public static final String RemoveDepartment = "RemoveDepartment";
	public static final String AddDepartmentMember = "AddDepartmentMember";
	public static final String RemoveDepartmentMember = "RemoveDepartmentMember";
	public static final String ChangeDepartmentMember = "ChangeDepartmentMember";
	public static final String MoveDepartmentMember = "MoveDepartmentMember";
	
	public static final String DepartmentAdd = "DepartmentAdd";
	public static final String DepartmentRemove = "DepartmentRemove";
	public static final String DepartmentUpdate = "DepartmentUpdate";
	public static final String DepartmentMemberAdd = "DepartmentMemberAdd";
	public static final String DepartmentMemberRemove = "DepartmentMemberRemove";
	public static final String DepartmentMemberMove = "DepartmentMemberMove";
	public static final String DepartmentMemberChange = "DepartmentMemberChange";
	public static final String GetDepartment = "GetDepartment";
	public static final String RequireResponse = "RequireResponse";
	
	
	public static final String EXTENSION_03=".xls";
	public static final String EXTENSION_07=".xlsx";
	public static final String Method = "Method";
	public static final String Query = "Query";
}
