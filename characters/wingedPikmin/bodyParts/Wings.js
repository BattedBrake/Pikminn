import { LIBS } from '../../../shared/libs.js';

export class Wings {
    constructor(gl, wingMesh) {
        this.gl = gl;
        this.wingMesh = wingMesh;

        this.wingVB = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.wingVB);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(wingMesh.vertices), gl.STATIC_DRAW);

        this.wingIB = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.wingIB);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(wingMesh.faces), gl.STATIC_DRAW);
    }

    render(shaderVars, mouseRot, time = 0) {
        const GL = this.gl;
        const STRIDE = 4 * 9;
        const flapAngle = Math.abs(Math.sin(time * 3.0)) * 0.5; 

        GL.uniform1f(shaderVars.uRoughness, 0.1); 
        GL.uniform1f(shaderVars.uShininess, 32.0);
        GL.uniform3f(shaderVars.uColor, 0.75, 0.90, 1.0); 

        GL.bindBuffer(GL.ARRAY_BUFFER, this.wingVB);
        GL.vertexAttribPointer(shaderVars.position, 3, GL.FLOAT, false, STRIDE, 0);
        GL.enableVertexAttribArray(shaderVars.position);
        GL.vertexAttribPointer(shaderVars.normal, 3, GL.FLOAT, false, STRIDE, 4 * 3);
        GL.enableVertexAttribArray(shaderVars.normal);
        GL.vertexAttribPointer(shaderVars.color, 3, GL.FLOAT, false, STRIDE, 4 * 6);
        GL.enableVertexAttribArray(shaderVars.color);
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.wingIB);

        const OFFSET_EDGE = 0.2; 

        // A. SAYAP KANAN
      
        var LOCAL_WING_R = LIBS.get_I4();
    
        LIBS.translateX(LOCAL_WING_R, 0.8);   
        LIBS.translateY(LOCAL_WING_R, -1.1);  
        LIBS.translateZ(LOCAL_WING_R, -0.5);  

        LIBS.rotateZ(LOCAL_WING_R, -Math.PI / 2); 
        LIBS.rotateX(LOCAL_WING_R, -Math.PI / 8); 

        LIBS.translateX(LOCAL_WING_R, -OFFSET_EDGE);

        const BASE_ANGLE_Y_R = Math.PI / 2;
        LIBS.rotateY(LOCAL_WING_R, BASE_ANGLE_Y_R + flapAngle); 

        LIBS.translateX(LOCAL_WING_R, OFFSET_EDGE); 
        LIBS.scale(LOCAL_WING_R, 0.2, 0.1, 0.2);

        var FINAL_WING_R = LIBS.get_I4();
        LIBS.multiply(FINAL_WING_R, mouseRot, LOCAL_WING_R);
        GL.uniformMatrix4fv(shaderVars.mMmatrix, false, FINAL_WING_R);
        GL.drawElements(GL.TRIANGLES, this.wingMesh.faces.length, GL.UNSIGNED_SHORT, 0);

        // B. SAYAP KIRI 
        
        var LOCAL_WING_L = LIBS.get_I4();
        
        LIBS.translateX(LOCAL_WING_L, -0.8);  
        LIBS.translateY(LOCAL_WING_L, -1.1);
        LIBS.translateZ(LOCAL_WING_L, -0.5);  

        LIBS.rotateZ(LOCAL_WING_L, Math.PI / 2); 
        LIBS.rotateX(LOCAL_WING_L, -Math.PI / 8); 

        LIBS.translateX(LOCAL_WING_L, OFFSET_EDGE);

        const BASE_ANGLE_Y_L = -Math.PI / 2;
        LIBS.rotateY(LOCAL_WING_L, BASE_ANGLE_Y_L - flapAngle); 

        LIBS.translateX(LOCAL_WING_L, -OFFSET_EDGE); 
        LIBS.scale(LOCAL_WING_L, 0.2, 0.1, 0.2);

        var FINAL_WING_L = LIBS.get_I4();
        LIBS.multiply(FINAL_WING_L, mouseRot, LOCAL_WING_L);
        GL.uniformMatrix4fv(shaderVars.mMmatrix, false, FINAL_WING_L);
        GL.drawElements(GL.TRIANGLES, this.wingMesh.faces.length, GL.UNSIGNED_SHORT, 0);
    }
}