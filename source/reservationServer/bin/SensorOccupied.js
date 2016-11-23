var exports = module.exports = SensorOccupied = function(){
  const OCCUPIED_LIMIT_SENSOR1 = 1;
  const OCCUPIED_LIMIT_SENSOR2 = 1;
  var occupied = false;
  var sensor1 = 0;
  var sensor2 = 0;
  
  var updateSensors = function(sens1, sens2, occ){
    this.sensor1 = sens1;
    this.sensor2 = sens2;
    
    this.occupied = sens1<=OCCUPIED_LIMIT_SENSOR1 && sens2<=OCCUPIED_LIMIT_SENSOR2;    
    return this.occupied==occ;
  };
  var getOccupiedState = function(){
    return this.occupied;
  }
};
