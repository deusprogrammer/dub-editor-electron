import React from 'react'

export default class ImageSelector extends React.Component {
    constructor(props) {
        super(props)
        this.imageNode = null
        this.inputNode = null
    }

    loadFile = (e, imageNode) => {
        let fr = new FileReader();
        let file = e.target.files[0];

        if (!file) {
            return;
        }

        const name = file.name;
        const lastDot = name.lastIndexOf('.');
        const ext = name.substring(lastDot + 1);

        fr.onload = () => {
            imageNode.src = fr.result;

            this.props.onChange(fr.result, ext);
        }

        fr.readAsDataURL(file)
    }

    render() {
        return (
            <div>
                <img 
                    className={this.props.className}
                    style={{cursor: 'pointer'}}
                    ref={(node) => {this.imageNode = node}}
                    src={this.props.src ? this.props.src : "https://dummyimage.com/1920X1080/8f8b8f/ffffff&text=Choose+an+Image"} 
                    onClick={() => {this.inputNode.click()}} />
                <input 
                    style={{visibility: "hidden", width: '0px', height: '0px'}}
                    ref={(node) => {this.inputNode = node}}
                    id="fileInput" 
                    type="file"
                    accept={this.props.accept}
                    onChange={(e) => {this.loadFile(e, this.imageNode)}} />
            </div>
        )
    }
}