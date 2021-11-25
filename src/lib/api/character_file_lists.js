export let characterlist = ['dorothy', 'scarecrow','tinwoodman','cowardlylion', 
    'glinda', 'wogglebug', 'jackpumpkinhead', 'jinjur', 'toto', 'munchkins', 'kalida', 
    'wizardofoz', 'flyingmonkeys', 'witchofthewest', 'witchofthenorth', 'hammerheads', 'tip', 
    'sawhorse', 'gump', 'mombi','ozma', 'jelliajamb','fieldmice','fightingtree','gotg','aoo','china'];



export function charactername(slug){
    switch(slug){
        case 'dorothy':
            return 'Dorothy Gale';
        case 'scarecrow':
            return 'Scarecrow';
        case 'tinwoodman':
            return 'Tin Woodman';
        case 'toto':
            return 'Toto';
        case 'cowardlylion':
            return 'Cowardly Lion';
        case 'glinda':
            return 'Glinda the Good Witch of the South';
        case 'wogglebug':
            return 'H. M. Woggle-Bug, T.E.';
        case 'jinjur':
            return 'General Jinjur';
        case 'munchkins':
            return 'The Munchkins';
        case 'kalida':
            return 'Kalida Monsters';
        case 'wizardofoz':
            return 'The Wizard of Oz';
        case 'flyingmonkeys':
            return 'Flying Monkeys';
        case 'witchofthewest':
            return 'The Wicked Witch of the West';
        case 'witchofthenorth':
            return 'The Witch of the North';
        case 'jackpumpkinhead':
            return 'Jack Pumpkinhead';
        case 'hammerheads':
            return 'The Hammer Heads';
        case 'tip':
            return 'Tip';
        case 'sawhorse':
            return 'The Sawhorse';
        case 'gump':
            return 'The Gump';
        case 'mombi':
            return 'Mombi';
        case 'ozma':
            return 'Princess Ozma of Oz';
        case 'fieldmice':
            return 'Fieldmice';
        case 'jelliajamb':
            return 'Jellia Jamb';
        case 'fightingtree':
            return 'The fighting trees';
        case 'gotg':
            return 'The guardian of the gate';
        case 'aoo':
            return 'Soldier with the Green Whiskers';
        case 'china':
            return 'People of the china country';
        default:
            return '';
    }
}



let character_lists = {
    'twwoo':{},
    'tmloo':{},
    'ooo':{},
    'datwio':{},
    'trto':{},
    'tecoo':{},
    'tpgoo':{},
    'ttoo':{},
    'tsoo':{},
    'rio':{},
    'tlpoo':{},
    'ttwoo':{},
    'tmoo':{},
    'goo':{}
};




//
// LISTS FOR THE BOOK tmloo
//
character_lists['tmloo']['jelliajamb'] = ['14730314766_09ea2cc387_o.jpg', '14750929574_0ce2e423b1_o.jpg'];

character_lists['tmloo']['ozma'] = ['14566670979_8e6ce746b5_o.jpg',
'14566673939_a17b389f54_o.jpg',
'14753318105_487297019e_o.jpg'];

character_lists['tmloo']['mombi'] = ['14566666458_3cac0b62ef_o.jpg',
'14566867227_f39dd64a36_o.jpg',
'14730250606_8c6458970c_o.jpg',
'14730256936_abf1cc595b_o.jpg',
'14750096681_1fc23eb66c_o.jpg',
'14750128451_39cb9a75c2_o.jpg',
'14773125643_eed8373b8f_o.jpg',
'14773126823_36b29767ea_o.jpg'];

character_lists['tmloo']['glinda'] = ['14566659598_c3363155be_o.jpg',
'14566662699_796c6f3e96_o.jpg',
'14566670979_8e6ce746b5_o.jpg',
'14750974584_91d2d9e16b_o.jpg',
'14753308105_2344c7093e_o.jpg',
'14753318105_487297019e_o.jpg',
'14773185943_481a24eaa5_o.jpg'];


character_lists['tmloo']['gump'] = ['14566617320_87e202b205_o.jpg',
'14566651509_90c95e2d82_o.jpg',
'14566654499_c75e121680_o.jpg',
'14750143251_96e433042a_o.jpg',
'14750145161_bb63444e5d_o.jpg',
'14750152681_bbd4da7a27_o.jpg',
'14750961904_ab0e99a1ca_o.jpg',
'14750975894_d80400f569_o.jpg',
'14753248105_fd573d9c07_o.jpg'];

character_lists['tmloo']['jinjur'] = ['14566629360_ecda30f330_o.jpg',
'14566636240_15aa8684ea_o.jpg',
'14566664289_dae983101b_o.jpg',
'14566867227_f39dd64a36_o.jpg',
'14730274956_18312f1eda_o.jpg',
'14730275286_413df391d8_o.jpg',
'14730295956_1c62a3e73e_o.jpg',
'14750114401_e64df62bd4_o.jpg',
'14750138461_cc4410b66f_o.jpg',
'14750157581_14958bb896_o.jpg',
'14750930444_dff8be66ef_o.jpg',
'14750932084_362db08613_o.jpg',
'14752997482_12873e5cea_o.jpg',
'14753318105_487297019e_o.jpg',
'14773143843_004bf273c0_o.jpg'];


character_lists['tmloo']['wogglebug'] = ['14566617320_87e202b205_o.jpg',
'14566634408_758cedece4_o.jpg',
'14566636018_a3d718ddfc_o.jpg',
'14566637188_121605d1c6_o.jpg',
'14566638618_3cb958fea6_o.jpg',
'14566642539_cea1ee2c65_o.jpg',
'14566654499_c75e121680_o.jpg',
'14566662699_796c6f3e96_o.jpg',
'14566838467_c2728f6858_o.jpg',
'14566842717_b5a11f4939_o.jpg',
'14566843417_1dfa051533_o.jpg',
'14566847497_3e768f26f7_o.jpg',
'14730295956_1c62a3e73e_o.jpg',
'14750134011_f0f0a2156e_o.jpg',
'14750143251_96e433042a_o.jpg',
'14750152681_bbd4da7a27_o.jpg',
'14750961904_ab0e99a1ca_o.jpg',
'14750974584_91d2d9e16b_o.jpg',
'14750975894_d80400f569_o.jpg',
'14752972562_793cd83b6c_o.jpg',
'14753248105_fd573d9c07_o.jpg',
'14753284875_442c6a6570_o.jpg',
'14753290445_2574698115_o.jpg',
'14753295665_a92a7acf8d_o.jpg',
'14753302625_27c6dcbd01_o.jpg',
'14753305185_7b72e0cdff_o.jpg',
'14753307455_0e0164db68_o.jpg',
'14753318105_487297019e_o.jpg',
'14773168113_da8544f410_o.jpg'];

character_lists['tmloo']['sawhorse'] = ['14566600610_74720b238f_o.jpg',
'14566611318_bdea79fbb1_o.jpg',
'14566617320_87e202b205_o.jpg',
'14566625568_66f753c221_o.jpg',
'14566625609_75042a48fc_o.jpg',
'14566634408_758cedece4_o.jpg',
'14566642539_cea1ee2c65_o.jpg',
'14566662699_796c6f3e96_o.jpg',
'14566814317_6bde500626_o.jpg',
'14566814817_c45697dea8_o.jpg',
'14566815387_393c6977c8_o.jpg',
'14566819687_c73b748c42_o.jpg',
'14566847497_3e768f26f7_o.jpg',
'14730265916_51514e3059_o.jpg',
'14730266216_e1e2831005_o.jpg',
'14730279566_38608359f8_o.jpg',
'14750104541_bcec574fd5_o.jpg',
'14750106211_56eb12a00e_o.jpg',
'14750134011_f0f0a2156e_o.jpg',
'14750143251_96e433042a_o.jpg',
'14750905364_22f6873d98_o.jpg',
'14750925994_8cfc345fb5_o.jpg',
'14750927304_ee369e70f6_o.jpg',
'14750961904_ab0e99a1ca_o.jpg',
'14752967312_7383aaf519_o.jpg',
'14752972562_793cd83b6c_o.jpg',
'14753276295_0c67d6f002_o.jpg',
'14753284875_442c6a6570_o.jpg',
'14753290445_2574698115_o.jpg',
'14773133783_2e4c4ffaaa_o.jpg',
'14773136403_0d9a6f7bc8_o.jpg',
'14773147603_86cbe56009_o.jpg',
'14773185943_481a24eaa5_o.jpg'];

character_lists['tmloo']['jackpumpkinhead'] = ['14566576090_e66227eb21_o.jpg',
'14566600610_74720b238f_o.jpg',
'14566611318_bdea79fbb1_o.jpg',
'14566611659_1cc09e48f4_o.jpg',
'14566616649_c053afab0f_o.jpg',
'14566616828_aabfd71618_o.jpg',
'14566617320_87e202b205_o.jpg',
'14566621569_1a918e0e81_o.jpg',
'14566625568_66f753c221_o.jpg',
'14566625609_75042a48fc_o.jpg',
'14566634408_758cedece4_o.jpg',
'14566642539_cea1ee2c65_o.jpg',
'14566654499_c75e121680_o.jpg',
'14566662699_796c6f3e96_o.jpg',
'14566814317_6bde500626_o.jpg',
'14566819687_c73b748c42_o.jpg',
'14566836727_2d9997a7f2_o.jpg',
'14566847497_3e768f26f7_o.jpg',
'14566850117_2ab98a3d36_o.jpg',
'14730250606_8c6458970c_o.jpg',
'14730253076_6206709ac1_o.jpg',
'14730256936_abf1cc595b_o.jpg',
'14730266216_e1e2831005_o.jpg',
'14730279566_38608359f8_o.jpg',
'14730295956_1c62a3e73e_o.jpg',
'14730314766_09ea2cc387_o.jpg',
'14750102901_8d6c4fb26e_o.jpg',
'14750106211_56eb12a00e_o.jpg',
'14750134011_f0f0a2156e_o.jpg',
'14750143251_96e433042a_o.jpg',
'14750152681_bbd4da7a27_o.jpg',
'14750905364_22f6873d98_o.jpg',
'14750911914_200cb354a6_o.jpg',
'14750919454_4e5c832f7e_o.jpg',
'14750925994_8cfc345fb5_o.jpg',
'14750927304_ee369e70f6_o.jpg',
'14750927744_bb6c91a10a_o.jpg',
'14750929574_0ce2e423b1_o.jpg',
'14750940944_967db626e3_o.jpg',
'14750961904_ab0e99a1ca_o.jpg',
'14750974584_91d2d9e16b_o.jpg',
'14750975894_d80400f569_o.jpg',
'14752967312_7383aaf519_o.jpg',
'14752972562_793cd83b6c_o.jpg',
'14753268085_0227f24608_o.jpg',
'14753276295_0c67d6f002_o.jpg',
'14753284875_442c6a6570_o.jpg',
'14753290445_2574698115_o.jpg',
'14753302625_27c6dcbd01_o.jpg',
'14753306155_fca353e421_o.jpg',
'14753318105_487297019e_o.jpg',
'14773124503_47ec1bf7e2_o.jpg',
'14773125643_eed8373b8f_o.jpg',
'14773129193_e8e530acb5_o.jpg',
'14773133783_2e4c4ffaaa_o.jpg',
'14773136403_0d9a6f7bc8_o.jpg',
'14773147603_86cbe56009_o.jpg',
'14773149293_065e144c9b_o.jpg',
'14773168113_da8544f410_o.jpg'];

character_lists['tmloo']['tip'] = ['14566576090_e66227eb21_o.jpg',
'14566577470_dfd254e00c_o.jpg',
'14566600610_74720b238f_o.jpg',
'14566611318_bdea79fbb1_o.jpg',
'14566616649_c053afab0f_o.jpg',
'14566617320_87e202b205_o.jpg',
'14566625568_66f753c221_o.jpg',
'14566625609_75042a48fc_o.jpg',
'14566634408_758cedece4_o.jpg',
'14566642539_cea1ee2c65_o.jpg',
'14566654499_c75e121680_o.jpg',
'14566660128_b4dbeb54c5_o.jpg',
'14566662699_796c6f3e96_o.jpg',
'14566814317_6bde500626_o.jpg',
'14566836727_2d9997a7f2_o.jpg',
'14566847497_3e768f26f7_o.jpg',
'14566850117_2ab98a3d36_o.jpg',
'14566855387_98820d07b1_o.jpg',
'14730250606_8c6458970c_o.jpg',
'14730253076_6206709ac1_o.jpg',
'14730254546_575f089404_o.jpg',
'14730266216_e1e2831005_o.jpg',
'14730279566_38608359f8_o.jpg',
'14730295956_1c62a3e73e_o.jpg',
'14750093931_3ab20948ab_o.jpg',
'14750106211_56eb12a00e_o.jpg',
'14750114401_e64df62bd4_o.jpg',
'14750118601_a4b054af2f_o.jpg',
'14750123361_dc13ea53a8_o.jpg',
'14750133681_2b7ed29339_o.jpg',
'14750134011_f0f0a2156e_o.jpg',
'14750143251_96e433042a_o.jpg',
'14750145161_bb63444e5d_o.jpg',
'14750151191_16dc84875c_o.jpg',
'14750152681_bbd4da7a27_o.jpg',
'14750905364_22f6873d98_o.jpg',
'14750911914_200cb354a6_o.jpg',
'14750919454_4e5c832f7e_o.jpg',
'14750925994_8cfc345fb5_o.jpg',
'14750940944_967db626e3_o.jpg',
'14750961904_ab0e99a1ca_o.jpg',
'14750974584_91d2d9e16b_o.jpg',
'14750975894_d80400f569_o.jpg',
'14752944182_5b0b9d31a1_o.jpg',
'14752957332_25fd548e07_o.jpg',
'14752967312_7383aaf519_o.jpg',
'14752972562_793cd83b6c_o.jpg',
'14752987252_83ba83ae9f_o.jpg',
'14753278005_118800d134_o.jpg',
'14753284875_442c6a6570_o.jpg',
'14753290445_2574698115_o.jpg',
'14753305185_7b72e0cdff_o.jpg',
'14753306155_fca353e421_o.jpg',
'14773125643_eed8373b8f_o.jpg',
'14773126823_36b29767ea_o.jpg',
'14773129193_e8e530acb5_o.jpg',
'14773133783_2e4c4ffaaa_o.jpg',
'14773136403_0d9a6f7bc8_o.jpg',
'14773147603_86cbe56009_o.jpg',
'14773149293_065e144c9b_o.jpg',
'14773168113_da8544f410_o.jpg'];

character_lists['tmloo']['tinwoodman'] = ['cover.jpeg',
'14566600610_74720b238f_o.jpg',
'14566617320_87e202b205_o.jpg',
'14566634408_758cedece4_o.jpg',
'14566642539_cea1ee2c65_o.jpg',
'14566654499_c75e121680_o.jpg',
'14566662699_796c6f3e96_o.jpg',
'14566801187_ab45d9c5d2_o.jpg',
'14566836727_2d9997a7f2_o.jpg',
'14566847497_3e768f26f7_o.jpg',
'14730295956_1c62a3e73e_o.jpg',
'14730306986_07e1944e65_o.jpg',
'14750134011_f0f0a2156e_o.jpg',
'14750143251_96e433042a_o.jpg',
'14750152681_bbd4da7a27_o.jpg',
'14750905364_22f6873d98_o.jpg',
'14750940944_967db626e3_o.jpg',
'14750961904_ab0e99a1ca_o.jpg',
'14750973104_e63c27aeb8_o.jpg',
'14750974584_91d2d9e16b_o.jpg',
'14750975894_d80400f569_o.jpg',
'14752972562_793cd83b6c_o.jpg',
'14753248105_fd573d9c07_o.jpg',
'14753279655_7292af2cb4_o.jpg',
'14753284875_442c6a6570_o.jpg',
'14753290445_2574698115_o.jpg',
'14753297415_8af320b7ac_o.jpg',
'14753305185_7b72e0cdff_o.jpg',
'14753318105_487297019e_o.jpg',
'14773121433_5157e20485_o.jpg',
'14773168113_da8544f410_o.jpg'];


character_lists['tmloo']['scarecrow'] = ['cover.jpeg',
'14566600610_74720b238f_o.jpg',
'14566616828_aabfd71618_o.jpg',
'14566617320_87e202b205_o.jpg',
'14566621569_1a918e0e81_o.jpg',
'14566625568_66f753c221_o.jpg',
'14566625609_75042a48fc_o.jpg',
'14566626570_6833eb04bb_o.jpg',
'14566634408_758cedece4_o.jpg',
'14566634699_4575c41847_o.jpg',
'14566635270_16e6be3777_o.jpg',
'14566642539_cea1ee2c65_o.jpg',
'14566654499_c75e121680_o.jpg',
'14566662699_796c6f3e96_o.jpg',
'14566801187_ab45d9c5d2_o.jpg',
'14566836727_2d9997a7f2_o.jpg',
'14566847497_3e768f26f7_o.jpg',
'14566850117_2ab98a3d36_o.jpg',
'14566855387_98820d07b1_o.jpg',
'14730250606_8c6458970c_o.jpg',
'14730279566_38608359f8_o.jpg',
'14730295956_1c62a3e73e_o.jpg',
'14730322066_dbe9658892_o.jpg',
'14750123361_dc13ea53a8_o.jpg',
'14750134011_f0f0a2156e_o.jpg',
'14750138461_cc4410b66f_o.jpg',
'14750143251_96e433042a_o.jpg',
'14750152681_bbd4da7a27_o.jpg',
'14750905364_22f6873d98_o.jpg',
'14750927744_bb6c91a10a_o.jpg',
'14750929574_0ce2e423b1_o.jpg',
'14750940944_967db626e3_o.jpg',
'14750961904_ab0e99a1ca_o.jpg',
'14750974584_91d2d9e16b_o.jpg',
'14750975894_d80400f569_o.jpg',
'14752967312_7383aaf519_o.jpg',
'14752972562_793cd83b6c_o.jpg',
'14753248105_fd573d9c07_o.jpg',
'14753268085_0227f24608_o.jpg',
'14753276295_0c67d6f002_o.jpg',
'14753278005_118800d134_o.jpg',
'14753284875_442c6a6570_o.jpg',
'14753290445_2574698115_o.jpg',
'14753297415_8af320b7ac_o.jpg',
'14753305185_7b72e0cdff_o.jpg',
'14753318105_487297019e_o.jpg',
'14773121433_5157e20485_o.jpg',
'14773147603_86cbe56009_o.jpg',
'14773168113_da8544f410_o.jpg',
'14773169153_309b38aebd_o.jpg'];

































//
// LISTS FOR THE BOOK twwoo
//

character_lists['twwoo']['jelliajamb'] = ['i140_edit.jpg', 'i158_edit.jpg'];
character_lists['twwoo']['glinda'] = ['i294_edit.jpg', 'i296_edit.jpg'];
character_lists['twwoo']['munchkins'] = ['i021.jpg',
'i023_edit.jpg',
'i031.jpg',
'i033.jpg',
'i035_edit.jpg',
'i037.jpg',
'i039_edit.jpg',
'i049_edit.jpg'];

character_lists['twwoo']['kalida'] = ['i084_edit.jpg', 'i093_edit.jpg'];

character_lists['twwoo']['wizardofoz'] = ['i150_edit.jpg',
'i152_edit.jpg',
'i155_edit.jpg',
'i208_edit.jpg',
'i212_edit.jpg',
'i214_edit.jpg',
'i218_edit.jpg',
'i220_edit.jpg',
'i226_edit.jpg',
'i230_edit.jpg',
'i231_edit.jpg',
'i234_edit.jpg',
'i238_edit.jpg',
'i240_edit.jpg'];

character_lists['twwoo']['flyingmonkeys'] = ['i162_edit.jpg',
'i172_edit.jpg',
'i174_edit.jpg',
'i194_edit.jpg',
'i198_edit.jpg',
'i202_edit.jpg',
'i206_edit.jpg'];

character_lists['twwoo']['witchofthewest'] = ['i160_edit.jpg',
'i163_edit.jpg',
'i174_edit.jpg',
'i178_edit.jpg',
'i180_edit.jpg'];

character_lists['twwoo']['aoo'] = ['i138_edit.jpg',
'i142_edit.jpg',
'i158_edit.jpg',
'i240_edit.jpg',
'i246_edit.jpg',
'i249_edit.jpg'];

character_lists['twwoo']['china'] = ['i264_edit.jpg', 'i266_edit.jpg', 'i270_edit.jpg'];

character_lists['twwoo']['hammerheads'] = ['i282_edit.jpg', 'i284_edit.jpg'];

character_lists['twwoo']['gotg'] = ['i124_edit.jpg', 'i136_edit.jpg', 'i254_edit.jpg'];

character_lists['twwoo']['fightingtree'] = ['i252_edit.jpg', 'i256_edit.jpg', 'i259_edit.jpg'];

character_lists['twwoo']['fieldmice'] = ['i112_edit.jpg',
'i114_edit.jpg',
'i116_edit.jpg',
'i118_edit.jpg',
'i121-i122_combo.jpg',
'i123_edit.jpg',
'i195-196_combo.jpg'];

character_lists['twwoo']['witchofthenorth'] = ['i006_edit.jpg',
'i017.jpg',
'i021.jpg',
'i028_edit.jpg',
'i030_edit.jpg',
'i059.jpg']




character_lists['twwoo']['dorothy'] = ['i009_edit.jpg',
'i011_edit.jpg',
'i013_edit.jpg',
'i016_edit.jpg',
'i019_edit.jpg',
'i021.jpg',
'i024_edit.jpg',
'i027_edit.jpg',
'i033.jpg',
'i037.jpg',
'i041_edit.jpg',
'i044_edit.jpg',
'i047.jpg',
'i051.jpg',
'i065_edit.jpg',
'i075_edit.jpg',
'i076_edit.jpg',
'i086_edit.jpg',
'i089-i090_combo.jpg',
'i093_edit.jpg',
'i095_edit.jpg',
'i098_edit.jpg',
'i109-edit.jpg',
'i111_edit.jpg',
'i116_edit.jpg',
'i127-i128_combo.jpg',
'i132_edit.jpg',
'i136_edit.jpg',
'i140_edit.jpg',
'i144_edit.jpg',
'i148_edit.jpg',
'i158_edit.jpg',
'i172_edit.jpg',
'i180_edit.jpg',
'i182_edit.jpg',
'i184_edit.jpg',
'i186_edit.jpg',
'i194_edit.jpg',
'i195-196_combo.jpg',
'i198_edit.jpg',
'i214_edit.jpg',
'i228_edit.jpg',
'i236_edit.jpg',
'i242_edit.jpg',
'i246_edit.jpg',
'i254_edit.jpg',
'i264_edit.jpg',
'i266_edit.jpg',
'i272_edit.jpg',
'i286_edit.jpg',
'i292_edit.jpg',
'i294_edit.jpg',
'i296_edit.jpg',
'i301_edit.jpg',
'i304_edit.jpg'];


character_lists['twwoo']['toto'] = ['i003_edit.jpg',
'i009_edit.jpg',
'i011_edit.jpg',
'i013_edit.jpg',
'i016_edit.jpg',
'i019_edit.jpg',
'i021.jpg',
'i024_edit.jpg',
'i037.jpg',
'i039_edit.jpg',
'i041_edit.jpg',
'i044_edit.jpg',
'i047.jpg',
'i051.jpg',
'i061_edit.jpg',
'i068_edit.jpg',
'i075_edit.jpg',
'i076_edit.jpg',
'i086_edit.jpg',
'i089-i090_combo.jpg',
'i093_edit.jpg',
'i098_edit.jpg',
'i101_edit.jpg',
'i111_edit.jpg',
'i118_edit.jpg',
'i126_edit.jpg',
'i127-i128_combo.jpg',
'i132_edit.jpg',
'i136_edit.jpg',
'i144_edit.jpg',
'i148_edit.jpg',
'i158_edit.jpg',
'i168_edit.jpg',
'i178_edit.jpg',
'i182_edit.jpg',
'i195-196_combo.jpg',
'i198_edit.jpg',
'i210_edit.jpg',
'i212_edit.jpg',
'i214_edit.jpg',
'i228_edit.jpg',
'i236_edit.jpg',
'i238_edit.jpg',
'i244_edit.jpg',
'i246_edit.jpg',
'i252_edit.jpg',
'i259_edit.jpg',
'i266_edit.jpg',
'i272_edit.jpg',
'i286_edit.jpg',
'i290_edit.jpg',
'i292_edit.jpg',
'i296_edit.jpg',
'i301_edit.jpg',
'i304_edit.jpg'];


character_lists['twwoo']['cowardlylion'] = ['i073_edit.jpg',
'i075_edit.jpg',
'i076_edit.jpg',
'i079_edit.jpg',
'i086_edit.jpg',
'i089-i090_combo.jpg',
'i093_edit.jpg',
'i095_edit.jpg',
'i109-edit.jpg',
'i121-i122_combo.jpg',
'i127-i128_combo.jpg',
'i132_edit.jpg',
'i148_edit.jpg',
'i155_edit.jpg',
'i158_edit.jpg',
'i169_edit.jpg',
'i172_edit.jpg',
'i186_edit.jpg',
'i195-196_combo.jpg',
'i214_edit.jpg',
'i224_edit.jpg',
'i228_edit.jpg',
'i231_edit.jpg',
'i246_edit.jpg',
'i272_edit.jpg',
'i274_edit.jpg',
'i276_edit.jpg',
'i278_edit.jpg',
'i292_edit.jpg',
'i294_edit.jpg'];



character_lists['twwoo']['scarecrow'] = ['i001_edit.jpg',
'i005_edit.jpg',
'i041_edit.jpg',
'i044_edit.jpg',
'i047.jpg',
'i049_edit.jpg',
'i051.jpg',
'i055_edit.jpg',
'i065_edit.jpg',
'i068_edit.jpg',
'i075_edit.jpg',
'i082_edit.jpg',
'i087_edit.jpg',
'i093_edit.jpg',
'i101_edit.jpg',
'i102_edit.jpg',
'i103_edit.jpg',
'i107_edit.jpg',
'i109-edit.jpg',
'i111_edit.jpg',
'i116_edit.jpg',
'i121-i122_combo.jpg',
'i127-i128_combo.jpg',
'i132_edit.jpg',
'i148_edit.jpg',
'i158_edit.jpg',
'i167_edit.jpg',
'i184_edit.jpg',
'i190_edit.jpg',
'i195-196_combo.jpg',
'i214_edit.jpg',
'i220_edit.jpg',
'i226_edit.jpg',
'i228_edit.jpg',
'i240_edit.jpg',
'i244_edit.jpg',
'i246_edit.jpg',
'i256_edit.jpg',
'i259_edit.jpg',
'i262_edit.jpg',
'i272_edit.jpg',
'i284_edit.jpg',
'i292_edit.jpg',
'i294_edit.jpg'];

character_lists['twwoo']['tinwoodman'] = ['i001_edit.jpg',
'i004_edit.jpg',
'i059.jpg',
'i061_edit.jpg',
'i063_edit.jpg',
'i065_edit.jpg',
'i070_edit.jpg',
'i071_edit.jpg',
'i075_edit.jpg',
'i082_edit.jpg',
'i089-i090_combo.jpg',
'i093_edit.jpg',
'i096_edit.jpg',
'i109-edit.jpg',
'i111_edit.jpg',
'i116_edit.jpg',
'i118_edit.jpg',
'i121-i122_combo.jpg',
'i127-i128_combo.jpg',
'i132_edit.jpg',
'i148_edit.jpg',
'i154_edit.jpg',
'i158_edit.jpg',
'i165_edit.jpg',
'i182_edit.jpg',
'i186_edit.jpg',
'i195-196_combo.jpg',
'i198_edit.jpg',
'i212_edit.jpg',
'i214_edit.jpg',
'i221_edit.jpg',
'i228_edit.jpg',
'i230_edit.jpg',
'i242_edit.jpg',
'i246_edit.jpg',
'i272_edit.jpg',
'i292_edit.jpg',
'i294_edit.jpg'];





















export function character_book_img_list(character,book){
    return character_lists[book]?.[character];
    //eval(character + '_in_' + book)
    return [];
}