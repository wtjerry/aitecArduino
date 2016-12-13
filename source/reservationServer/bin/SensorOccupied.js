var exports = module.exports = {};

exports.SensorOccupied = function (){
  this.OCCUPIED_LIMIT_SENSOR1 = 1;
  this.OCCUPIED_LIMIT_SENSOR2 = 1;
  this.occupied = false;
  this.sensor1 = 0;
  this.sensor2 = 0;
  
  this.updateSensors = function(sens1, sens2, occ){
    this.sensor1 = sens1;
    this.sensor2 = sens2;
    
    this.occupied = sens1<=OCCUPIED_LIMIT_SENSOR1 && sens2<=OCCUPIED_LIMIT_SENSOR2;    
    return this.occupied==occ;
  };
  this.getOccupiedState = function(){
    return this.occupied;
  };
};
