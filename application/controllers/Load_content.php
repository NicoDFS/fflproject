<?php
class Load_content extends MY_User_Controller{

// This controller presents the ajax data used by various jquery ajax/post functions.
// The views dislay content to be put between <tbody></tbody> tags.


    function __construct()
    {

        parent::__construct();
        $this->load->model('myteam/waiverwire_model');
        $this->load->model('player_search_model');

        $this->data = array('success' => FALSE);

        // Defaults
        $this->limit = 10;

        if ($this->input->post('limit'))
            $this->limit = $this->input->post('limit');

        // $this->in_page = $this->input->post('page');
        // $this->in_pos = $this->input->post('pos');
        // $this->in_sort = $this->input->post('by');
        // $this->in_order = $this->input->post('order');
        // $this->in_search = $this->input->post('search');

        // $this->year = $this->input->post('year');
        // $this->starter = $this->input->post('starter');
        // $this->custom = $this->input->post('custom');

        // $this->order_by = array('points','desc');

        // $this->data['page'] = ($this->in_page == '') ? 0 : $this->in_page;
        // $this->data['sel_pos'] = ($this->in_pos == '') ? '0' : $this->in_pos;
        // $this->data['by'] = ($this->in_sort == '') ? 'points' : $this->in_sort;
        // $this->data['order'] = ($this->in_order == '') ? 'asc' : $this->in_order;
        // $this->data['search'] = $this->in_search;

        // $this->order_by = array($this->data['by'],$this->data['order']);

    }

    function ww_player_list()
    {

        # NICK YOU NEED TO MAKE THIS WORK NEXT, ADD NEXT BUTTONS TO ADD MORE LIKE NEWS DOES

        $this->load->model('myteam/waiverwire_model');
        $this->load->model('myteam/myteam_roster_model');

        $nfl_players = $this->waiverwire_model->get_nfl_players($this->limit, 0, '');
  
        $view_data['total'] = $nfl_players['count'];
        $view_data['players'] = $nfl_players['result'];
        #$view_data['per_page'] = 10;
        #$view_data['in_page'] = 1;
        $view_data['matchups'] = $this->myteam_roster_model->get_nfl_opponent_array();
        $view_data['byeweeks'] = $this->common_model->get_byeweeks_array();
        //$this->load->view('user/myteam/waiverwire/ajax_pickup_table',$data);

        // BEGIN VIEW
        $this->data['total'] = $view_data['total'];
        $this->data['count'] = $this->limit;
        $this->data['html'] = $this->load->view('load_content/ww_player_list',$view_data,True);
        // END VIEW


        $this->data['success'] = True;


        echo json_encode($this->data);
    }


    function admin_rosters_player_search()
    {
        $this->common_model->force_league_admin();
//        function get_nfl_players($limit = 100000, $start = 0, $nfl_pos = 0, $order_by = array('last_name','asc'),$search='',
//        $show_owned = true, $show_inactive = false, $hide_non_lea = true)

        $nfl_players = $this->player_search_model->get_nfl_players($this->limit);
        $this->load->model('myteam/myteam_roster_model');
        $view_data['total'] = $nfl_players['count'];
        $view_data['players'] = $nfl_players['result'];
        // $view_data['matchups'] = $this->myteam_roster_model->get_nfl_opponent_array();

        //$this->load->view('player_search/ajax_full_player_list',$this->data);
        $this->data['total'] = $view_data['total'];
        $this->data['count'] = $this->limit;
        $this->data['html'] = $this->load->view('load_content/admin_rosters_player_search',$view_data,True);

        $this->data['success'] = True;

        echo json_encode($this->data);

    }


    function admin_lineup_player_search()
    {
        $this->common_model->force_league_admin();

        $year = $this->input->post('var1');

        $nfl_players = $this->player_search_model->get_nfl_players($this->limit);
        $this->load->model('myteam/myteam_roster_model');

        $view_data['total'] = $nfl_players['count'];
        $view_data['players'] = $nfl_players['result'];
        $view_data['pos_lookup'] = $this->common_model->get_leapos_lookup_array($year);

//        $this->data['matchups'] = $this->myteam_roster_model->get_nfl_opponent_array();

        $this->data['total'] = $view_data['total'];
        $this->data['count'] = $this->limit;
        $this->data['html'] = $this->load->view('load_content/admin_lineup_player_search',$view_data,True);

        $this->data['success'] = True;

        echo json_encode($this->data);        
    }

    function news_items()
    {
        $this->load->model('league/news_model');
        $news_data = $this->news_model->get_news_data($this->limit, 0);
        $this->data['html'] = $this->load->view('load_content/news_items',$news_data,True);
        $this->data['total'] = $news_data['total'];
        $this->data['count'] = count($news_data['news']);
        $this->data['success'] = true;

        echo json_encode($this->data);

    }


    function news_ww_tbody()
    {
        $this->load->model('myteam/waiverwire_model');

        if($this->leagueid == "")
        {
            $wwdata = array();
        }
        else
        {
            $wwdata = $this->waiverwire_model->get_log_data($this->current_year,$this->limit, 0);
            $this->data['count'] = count($wwdata['result']);
            $this->data['total'] = $wwdata['total'];
        }

        // $this->per_page = 3;
        // $data = $this->waiverwire_model->get_log_data($this->current_year,$this->limit, 0, 3);
        // $waiverwire_log = $data['result'];
        
        $this->data['html'] = $this->load->view('load_content/news_ww_tbody',$wwdata,True);
        $this->data['success'] = true;

        echo json_encode($this->data);
    }

    function news_moves_items()
    {
        $this->load->model('myteam/waiverwire_model');
        
        if($this->leagueid == "")
        {
            $wwdata = array();
        }
        else
        {
            $wwdata = $this->waiverwire_model->get_log_data($this->current_year,$this->limit, 0);
            $this->data['count'] = count($wwdata['result']);
            $this->data['total'] = $wwdata['total'];
        }

        // $this->per_page = 3;
        // $data = $this->waiverwire_model->get_log_data($this->current_year,$this->limit, 0, 3);
        // $waiverwire_log = $data['result'];
        
        $this->data['html'] = $this->load->view('load_content/news_moves_items',$wwdata,True);
        $this->data['success'] = true;

        echo json_encode($this->data);
            
        
    }

    function news_standings()
    {
        $this->load->model('season/standings_model');
        $view_data['divs'] = $this->standings_model->get_year_standings($this->session->userdata('year'));
        $view_data['defs'] = $this->standings_model->get_notation_defs();
        $this->data['html'] = $this->load->view('load_content/news_standings_html',$view_data,True);

        $this->data['success'] = true;

        echo json_encode($this->data);


    }
}