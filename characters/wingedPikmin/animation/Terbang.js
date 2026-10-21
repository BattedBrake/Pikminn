export function poseTerbang(pikmin) {
    var pose = pikmin.pose;

    pose.kepala = 0;                    
    pose.badan = 5 * Math.PI / 12;      

    pose.lengan.angkat = Math.PI / 6;   
    pose.lengan.ayun = Math.PI / 8;  
    pose.lengan.siku = Math.PI / 10;  

    pose.kaki.ayun = Math.PI / 6;  
}
