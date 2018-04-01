// ###############################
//  Server Sent events
// ###############################

// function sse_on(sse_func)
// {
// 	var url = BASE_URL+"sse/turn_on/"+sse_func
// }

// function sse_off(sse_func)
// {
// 	var url = BASE_URL+"sse/turn_off/"+sse_func
// 	$.post(url, {}, function(){});
// }

function sse_stream_start()
{
	var sse_func = "";
	if (window.location.pathname.indexOf("season/scores/live/standard") !== -1 || window.location.pathname.indexOf("season/scores/live/compact") !== -1){sse_func="sse_live_scores";}
	if (window.location.pathname.indexOf("season/draft/live") !== -1){sse_func="sse_live_draft";}
	
	if (typeof(evtSource) == "undefined")
    {
		//if (typeof(sse_func) == 'undefined'){evtSource = new EventSource(BASE_URL+"sse/stream");}
		evtSource = new EventSource(BASE_URL+"sse/stream/"+sse_func);
        evtSource.onmessage = function(e)
        {

			var d = JSON.parse(e.data);
			debug_out('SSE Stream data',d);
			// Show/Hide live score url
			if (d.ls != undefined)
			{
				if (d.ls == "on")
					{$(".livescores-link").removeClass('hide');}
				else
					{$(".livescores-link").addClass('hide');}
			}

			// Update who's online text
			if (d.wo != undefined)
			{
				var text = "Who's Here: ";
				$.each(d.wo,function(index, owner){
					if (owner.a == 1)
						{text+='<span class="wo-admin">'+owner.n+'</span>';}
					else
						{text+=owner.n;}
					if (d.wo.length-1 > index)
					{text+=", ";}
					$("#whos-online").html(text);
				});
			}

			if (d.chat != undefined)
			{
				$.each(d.chat,function(i, msg){
					// This is for the popup ballons.
					// Don't show these for mobile view.
					if (chatOpen() != true && $("#chat-button").is(":visible") && msg.is_me == 0)
					{
						var text = "<b>"+msg.chat_name+"</b><br><i>"+msg.message_text+"</i>";
						var chat_jbox = new jBox('Tooltip', {
							content: text,
							target: $("#chat-button"),
							width: 200,
							addClass: 'Tooltip-chat',
							stack: false
						});
						chat_jbox.open();
						setTimeout(function(){chat_jbox.close();},4000);
					}
					// If chatbox exists, append the chats
					if (typeof(cb) != undefined)
					{

						bottom = chatScrollBottom();
						$(".chat-history-ajax").append(msg.html);
						if(bottom){chatScrollBottom(true);}
					}
				});
			}
			if (d.ur != undefined)
			{
				if (parseInt(d.ur) > 0)
					{$(".unread-count").text(" ("+d.ur+")");}
				else{$(".unread-count").text("");}
			}

			// Live draft updates
			if (d.live_draft != undefined && d.live_draft.update)
			{
				// First, refresh recent picks table data				
				function add_one_pick(pick_data, no_player)
				{
					var has_player = true;
					var tr_html = '';
					if(pick_data.player_id == undefined){has_player = false;}

					if (pick_data.pick_id == d.live_draft.current_pick.pick_id)
					{tr_html = '<tr class="d-rp-currentpick">';}
					else if(has_player)
					{tr_html = '<tr class="d-rp-recentpick">';}
					else
					{tr_html = '<tr class="d-rp-futurepick">';}
	
					tr_html += '<td>'+pick_data.actual_pick+'</td>';
					tr_html += '<td>'+pick_data.round+'-'+pick_data.pick+'</td>';
					if (no_player == true)
					{tr_html += '<td>???</td>';}
					else
					{tr_html += '<td>'+pick_data.first_name+' '+pick_data.last_name+' ('+pick_data.club_id+' - '+pick_data.position+')</td>';}
					tr_html += '<td>'+pick_data.team_name+'</td>';
					tr_html += '<td>'+pick_data.owner+'</td>';
					tr_html += '</tr>';

					$('#recent-picks').append(tr_html);
				}
				{$('#recent-picks').html('');}
				$.each(d.live_draft.upcoming_picks,function(id, player){
					if (d.live_draft.current_pick.pick_id == player.pick_id)
						{return;}
					add_one_pick(player,true);
				});
				
				add_one_pick(d.live_draft.current_pick,true);

				$.each(d.live_draft.recent_picks,function(id,player){
					// Update draft table to hide draft/watch buttons for recently drafted players
					$('.draft-avail-'+player.player_id).text(player.team_name);
					// Update watch table to remove recently drafted players
					$('.watch-avail-'+player.player_id).remove();
					add_one_pick(player);
				});

				// Disable/enable draft buttons if pause status changed
				if ((d.live_draft.current_pick.team_id == TEAM_ID && d.live_draft.paused <= 0) || (LEAGUE_ADMIN && $("#admin-picks").data('on')))
					{$(".btn-draft:contains('Draft')").attr("disabled",false);}
				else
					{$(".btn-draft:contains('Draft')").attr("disabled",true);}
				
				
				if (d.live_draft.paused > 0){$('#countdown').data('paused', 1);}
				else{$('#countdown').data('paused', 0);}

				// Next, refresh on-the-block data
				$('#d-block-title').text('Now Picking');
				$('#countdown').data('seconds', d.live_draft.current_pick.seconds_left-1);
				$('#countdown').data('deadline', d.live_draft.current_pick.deadline);
				$('#countdown').data('currenttime', d.live_draft.current_time);
				$('#countdown').data('teamid', d.live_draft.current_pick.team_id);
				$('.d-block-round').text("Round "+d.live_draft.current_pick.round+" Pick "+d.live_draft.current_pick.pick);
				$('#d-block-team-logo').attr("src", d.live_draft.current_pick.logo_url);
				$('.d-block-team-name').text(d.live_draft.current_pick.team_name);

				// Also update some admin stuff in on-the-block
				if (d.live_draft.start_time == "" || d.live_draft.start_time > d.live_draft.current_time)
					{$("#admin-pause-button").text("Start Draft");
						console.log("adsfasfasdfasdfas");
						}
				else if ((d.live_draft.start_time <= d.live_draft.current_time) && d.live_draft.paused <= 0)
					{$("#admin-pause-button").text("Pause Draft");}
				else if ((d.live_draft.start_time <= d.live_draft.current_time) && d.live_draft.paused > 0)
					{$("#admin-pause-button").text("Resume Draft");}
				$("#admin-undo").attr("disabled",(d.live_draft.paused <= 0));

				// Next refresh My Team table
				function add_one_myteam(player)
				{
					var tr_html = '<tr>';
					tr_html += '<td><strong>'+player.first_name+' '+player.last_name+'</strong></td>';
					tr_html += '<td>'+player.club_id+' - '+player.position+'</td>';
					tr_html += '<td>Week '+d.live_draft.byeweeks[player.club_id]+'</td>';
					tr_html += '<td>'+player.actual_pick+'</td>';
					tr_html += '<td class="hide-for-extra-small">Rd: '+player.round+' Pick: '+player.pick+'</td>';

					tr_html += '</tr>';

					$('#myteam-list').append(tr_html);
				}
				$('#myteam-list').html('');
				$.each(d.live_draft.myteam,function(id,player){
					add_one_myteam(player);
				});
				
				debug_out("Update draft data.");
			}


			// Live scoring updates
			if (d.live != undefined)
			{
				var last_key = $("#lsdata").data('last_key');
				$("#lsdata").data('last_key',d.live.key);
				// Update team scores
				$.each(d.live.scores.teams,function(id, score){
					$(".teamscore-"+id).text(score);
				});

				// Update player scores
				$.each(d.live.scores.players,function(id, score){
					$(".playerscore-"+id).text(score);
				});

				// Go through each player in the dom because we need to set the live player text and team text
				$.each($('.ls-c-playerbox'),function(){

					var player_id = $(this).data('id');

					// If player box is empty, don't do anything.
					if (player_id == undefined){return;}
					var team = $(this).data('team');
					var delay = 0;
					// Is this player in live player?
					if (d.live.players_live.hasOwnProperty(player_id) && last_key != undefined)
					{
						var last_play = $(this).data('playid');
						var this_play = d.live.players_live[player_id].play_id
						// Check if the update for this playid was already shown.
						if (last_play != this_play)
						{
							// Player has a live upate, show that text and delay showing team status
							playerEvent(player_id, d.live.players_live[player_id].text);
							delay = 10000;
							$(this).data('playid',this_play);
						}
					}
					playerTeamStatus(player_id,d.live.nfl_games[team],delay,team,last_key);
				});

				// Update NFL game status on standard view
				$.each(d.live.nfl_games, function(id, game)
				{
					if (game.pts != undefined)
					{
						$("."+id+"-score").text(game.pts);
						if (game.a != undefined)
						{
							nflGameActive(id, game);
						}
						else
						{
							nflGameInactive(id, game);
						}
					}
					else{
						nflGameInactive(id, game);
					}
				});
			}

			if (d.debug != undefined)
			{
				debug_out(d.debug);
			}

        }
	}
	else {
		debug_out("Already started sse stream.");
	}
}

// Stuff used for live scoring
function nflGameInactive(id, game)
{
	var gamerowid = "."+id+"-gamerow";
	$(gamerowid).addClass("ls-s-nflgameinactive");
	$(gamerowid).removeClass("ls-s-nflgameactive");
	$(gamerowid+" .ls-s-nflgame-down").text('');
	$(gamerowid+" .ls-s-nflgame-clock").text('');
	$(gamerowid+" .ls-s-nflgame-lastplay").text(game.s);
	$(gamerowid+" .ls-s-drivebar").addClass('hide');
}

function nflGameActive(id, game)
{
	var gamerowid = "."+id+"-gamerow";
	$(gamerowid).addClass("ls-s-nflgameactive");
	$(gamerowid).removeClass("ls-s-nflgameinactive");
	$(gamerowid+" .ls-s-nflgame-down").text(game.data.d);
	$(gamerowid+" .ls-s-nflgame-clock").text(game.data.t);
	$(gamerowid+" .ls-s-nflgame-lastplay").text(game.d);

	$(gamerowid+" .ls-s-drivebar").removeClass('hide');
	var yl = game.y;
	$(gamerowid+" .progress-meter").width(yl+"%");
	if(yl > 50){yl=Math.abs(yl-100);}
	$(gamerowid+" .progress-meter-text").text(yl+" yl");

	if (game.a == 1)
	{$(gamerowid+" ."+id+"-clubid").addClass('ls-s-nflgame-offense');}
	else {$(gamerowid+" ."+id+"-clubid").removeClass('ls-s-nflgame-offense');}
}


function playerEvent(player_id, text)
{
	playerBoxFromTeam('p_'+player_id).addClass("ls-playerevent");
	$(".p_"+player_id+" .ls-c-gamestatus").text(text);
	$(".p_"+player_id+" .ls-s-gamestatus").text(text);
}

// Classes a 'playerbox' can be: ls-playeractive, ls-gameinactive (default to active game inactive player)
function playerTeamStatus(player_id,team,delay,team_name,last_key)
{
	// team.d = details
	setTimeout(function(){

		var id = "p_"+player_id;
		var last_play = $("."+id).data('team_playid');

		if (last_play == team.p && team.p != undefined){return;}
		$("."+id).data('team_playid',team.p);

		// There are details we should show with settimeout
		if (delay == 0 && team.d != undefined && last_key != undefined)
		{
			$(".p_"+player_id+" .ls-c-gamestatus").text(team.d);
			setTimeout(function(){
				$(".p_"+player_id+" .ls-c-gamestatus").text(team.s);
			},10000);
		}
		else {
			$(".p_"+player_id+" .ls-c-gamestatus").text(team.s);
		}
		$(".p_"+player_id+" .ls-s-gamestatus").text(team.s);
		$("."+id).removeClass("ls-playerevent");
		// This game is not live
		if (team.a == undefined)
		{
			gameInactive(id);
		}
		else
		{
			var yl = team.y;
			$("."+id+" .progress-meter").width(yl+"%");
			if(yl > 50){yl=Math.abs(yl-100);}
			$("."+id+" .progress-meter-text").text(yl+" yl");
			// Live game and team/def.off is active
			if (team.a == 1)
			{
				playerActive(id);
			}
			else // Live game, but not active
			{
				playerInactive(id);
			}
		}
	},delay);

}


function gameInactive(id)
{
	playerBoxFromTeam(id).removeClass("ls-playeractive");
	playerBoxFromTeam(id).removeClass("ls-playerinactive");
	playerBoxFromTeam(id).addClass("ls-gameinactive");
	$("."+id+" .ls-c-drivebar").addClass("hide");

}

// Player is on the field
function playerActive(id)
{
	playerBoxFromTeam(id).removeClass("ls-gameinactive");
	playerBoxFromTeam(id).removeClass("ls-playerinactive");
	playerBoxFromTeam(id).addClass('ls-playeractive');
	$("."+id+" .progress").addClass('success');
	$("."+id+" .progress").removeClass('secondary')
	$("."+id+" .ls-c-drivebar").removeClass("hide");
}

// This is the default, remove both classes
function playerInactive(id)
{
	playerBoxFromTeam(id).removeClass("ls-gameinactive");
	playerBoxFromTeam(id).removeClass('ls-playeractive');
	playerBoxFromTeam(id).addClass("ls-playerinactive");
	$("."+id+" .progress").removeClass('success');
	$("."+id+" .progress").addClass('secondary')
	$("."+id+" .ls-c-drivebar").removeClass("hide");
}

function playerBoxFromTeam(id)
{
	return $("."+id+".ls-c-playerlight, ."+id+".ls-c-playerbox, ."+id+".ls-c-playerscore");
}