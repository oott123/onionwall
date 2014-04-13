<?php
	require 'init.inc.php';
	$key = '';
	$bbs = 'http://bbs.csu.edu.cn/bbs/plugin.php?id=ylybbs_relatepost:get_by_tid&';
	$ava = 'http://bbs.its.csu.edu.cn/ilovebbs/avatar.php?size=middle&uid=';
	$data['time'] = time();
	$data['query'] = '211533';
	$data['sign'] = md5($data['query'].'|'.$data['time'].'|'.$key);
	$data['pid'] = get_meta('bbs_max_pid');
	$url = $bbs.http_build_query($data);
	//var_dump($url);
	//var_dump(json_decode(file_get_contents($url)));
	$c = new Curl();
	$data = $c->get($url);
	$data = json_decode($data,1);
	if(count($data['data'])>0){
		$max_pid = $data['data'][count($data['data'])-1]['pid'];
		save_meta('bbs_max_pid',$max_pid);
	}
	foreach ($data['data'] as $datum) {
		$datum['name'] = $datum['author'];
		$datum['avatar'] = $ava.$datum['authorid'];
		save_item($datum);
	}
	echo 'successfully saved '.count($data['data']).' items.';
