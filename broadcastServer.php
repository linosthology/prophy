<?php

// prevent the server from timing out
set_time_limit(0);

// include the web sockets server script (the server is started at the far bottom of this file)
require './class.PHPWebSocket.php';

$maxMessageLength = 200;


// when a client sends data to the server
function wsOnMessage($clientID, $message, $messageLength, $binary) {
	global $server;
	global $serverURL;
	global $serverPort;
	global $maxMessageLength;
	
	$ip = long2ip( $server->wsClients[$clientID][6] );

	// check if message length is 0
	if ($messageLength == 0) {
		$server->wsClose($clientID);
		return;
	}
	
	////////////////////////////////////////////////////////////////////////////////////////
	if($messageLength > $maxMessageLength) {
		$message = substr($message, 0, $maxMessageLength);
//		$message = $message  . "+++Nachricht war laenger als $maxMessageLength Zeichen.";
		$messageLength = strlen($message);
		
		// additional message to client:
		$Server->wsSend($clientID, "+++ message is too long. Only $maxMessageLength were send.");
	}
	
	//---------------------------------------------------
	if($message == "giveURLandPort") {
		$server->wsSend($clientID, "+++ { \"url\": \"$serverURL\", \"port\": $serverPort }");
		return;
	}
	////////////////////////////////////////////////////////////////////////////////////////

	//The speaker is the only person in the room. Don't let them feel lonely.
	if ( sizeof($server->wsClients) == 1 )
		$server->wsSend($clientID, "+++ currently you are the only active Client.");
	else
		//Send the message to everyone but the person who said it
		foreach ( $server->wsClients as $id => $client )
			if ( $id != $clientID )
				$server->wsSend($id, "$message");
}

// when a client connects
function wsOnOpen($clientID)
{
	global $server;
	global $serverURL;
	global $serverPort;

	$ip = long2ip( $server->wsClients[$clientID][6] );

	$server->log( "$ip ($clientID) has connected." );
	
	// erfolgreiche Verbindung neuem Client melden:
	$server->wsSend($clientID, "+++ as Client $clientID connected with $serverURL:$serverPort");

	//Send a join notice to everyone but the person who joined
	foreach ( $server->wsClients as $id => $client )
		if ( $id != $clientID )
			$server->wsSend($id, "+++ client $clientID (IP: $ip) connected");
}

// when a client closes or lost connection
function wsOnClose($clientID, $status) {
	global $server;
	global $serverURL;
	global $serverPort;

	$ip = long2ip( $server->wsClients[$clientID][6] );

	$server->log( "$ip ($clientID) has disconnected." );


	//Send a user left notice to everyone in the room
	foreach ( $server->wsClients as $id => $client )
		$server->wsSend($id, "+++ client $clientID (IP: $ip) disconnected.");
}

// start the server

$server = new PHPWebSocket();
$server->bind('message', 'wsOnMessage');
$server->bind('open', 'wsOnOpen');
$server->bind('close', 'wsOnClose');

// for other computers to connect, you will probably need to change this to your LAN IP or external IP,
// alternatively use: gethostbyaddr(gethostbyname($_SERVER['SERVER_NAME']))

$serverURL = "localhost";
$serverPort = 8080;

$server->wsStartServer($serverURL, $serverPort);

?>
