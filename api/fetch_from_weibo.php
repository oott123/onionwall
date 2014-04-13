<?php
	require 'init.inc.php';
	$appkey = '';
	$appsec = '';
	$sharp = '云麓17年';
	//token:https://api.weibo.com/oauth2/authorize?client_id=4134533357&redirect_uri=https://api.weibo.com/oauth2/default.html&response_type=code
	$token = get_meta('weibo_token');
	if(!$token && !isset($_GET['code'])){
?>
<form method="get">code:<input name="code"></input></form>
<?php
		die('https://api.weibo.com/oauth2/authorize?client_id='.$appkey.'&redirect_uri=https://api.weibo.com/oauth2/default.html&response_type=code');
	}
	$c = new Curl(array('ssl'=>1,'port'=>443));
	if(!$token){
		//获取token
		$data = $c->post('https://api.weibo.com/oauth2/access_token',array(
			'client_id'=>$appkey
			,'client_secret'=>$appsec
			,'grant_type'=>'authorization_code'
			,'code'=>$_GET['code']
			,'redirect_uri'=>isset($_GET['redirect_uri'])?$_GET['redirect_uri']:'https://api.weibo.com/oauth2/default.html'));
		$data = json_decode($data,1);
		if(isset($data['error_description'])){
			echo $data['error_description'];
			die();
		}
		$token = $data['access_token'];
		save_meta('weibo_token',$token);
		die('token saved. clear get to continue.');
	}
	$url = 'https://api.weibo.com/2/search/topics.json';
	$para['access_token'] = $token;
	$para['q'] = $sharp;
	$data = $c->get($url,$para);
	$data = json_decode($data,1);
	$max_id = get_meta('weibo_since_id');
	$weibo_since_id = false;
	$count = 0;
	for ($i=count($data['statuses'])-1; $i >= 0; $i--) { 
		$datum = $data['statuses'][$i];
		if($datum['idstr'] <= $max_id){
			continue;
		}
		$weibo_since_id = $datum['idstr'];
		$datum['name'] = $datum['user']['screen_name'];
		$datum['avatar'] = $datum['user']['avatar_large'];
		$datum['message'] = $datum['text'];
		save_item($datum);
		$count++;
	}
	/*
	foreach($data['statuses'] as $datum){
		if($datum['idstr'] <= $max_id){
			continue;
		}
		if(!$weibo_since_id) $weibo_since_id = $datum['idstr'];
		$datum['name'] = $datum['user']['screen_name'];
		$datum['avatar'] = $datum['user']['avatar_large'];
		$datum['message'] = $datum['text'];
		save_item($datum);
		$count++;
	}
	*/
	if($weibo_since_id) save_meta('weibo_since_id',$weibo_since_id);
	echo 'successfully saved '.$count.' items.';
